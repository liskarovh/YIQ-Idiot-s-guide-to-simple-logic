/** @packageDocumentation
 * Core game engine for the Minesweeper backend.
 * Enhanced with detailed console logging for debugging.
 */

import {randomUUID} from "crypto";
import {maskGameViewForClient} from "./util";
import type {GameOptions, ComputedCell, GameSession, GameView, Snapshot} from "./types";

const mem = new Map<string, GameSession>();

function nowMs() { return Date.now(); }

function logStart(fn: string, meta?: any) {
    console.debug(`[engine] START ${fn}`, meta ?? {});
    return nowMs();
}

function logEnd(fn: string, start: number, meta?: any) {
    const dur = Math.round(nowMs() - start);
    console.debug(`[engine] END   ${fn}`, {...(meta ?? {}), durationMs: dur});
}

function renderSolutionMap(grid: ComputedCell[][]): string[] {
    return grid.map(row =>
                        row.map(cell => (cell.isMine ? '*' : (cell.adjacentMines > 0 ? String(cell.adjacentMines) : '.'))).join('')
    );
}

function logGridInfo(rows: number, cols: number, minePositions: Array<[number, number]>, grid: ComputedCell[][]) {
    try {
        console.groupCollapsed('[engine] Grid info');
        console.debug('size', `${rows}x${cols}`);
        console.debug('minePositions count', minePositions.length, minePositions);
        console.debug('rendered map:');
        for (const line of renderSolutionMap(grid)) {
            console.debug(line);
        }
        const counts: Record<string, number> = {};
        for (let r = 0; r < grid.length; r++) {
            const row = grid[r];
            if (!row) continue;
            for (let c = 0; c < row.length; c++) {
                const cell = row[c];
                if (!cell) continue;
                const key = cell.isMine ? 'mine' : String(cell.adjacentMines);
                counts[key] = (counts[key] || 0) + 1;
            }
        }
        console.debug('cell counts', counts);
        console.groupEnd();
    } catch (e) {
        console.error('[engine] logGridInfo error', e);
    }
}

function computeSolutionGrid(rows: number, cols: number, minePositions: Array<[number, number]>): ComputedCell[][] {
    const start = logStart("computeSolutionGrid", { rows, cols, mines: minePositions.length });

    const grid: ComputedCell[][] = Array.from({length: rows}, () =>
        Array.from({length: cols}, () => ({
            isMine: false,
            adjacentMines: 0
        }))
    );

    const mineSet = new Set<string>();
    for(const [r, c] of minePositions) {
        if(r >= 0 && r < rows && c >= 0 && c < cols) {
            const cell = grid[r]?.[c];
            if (cell) cell.isMine = true;
            mineSet.add(`${r},${c}`);
        } else {
            console.warn('[engine] computeSolutionGrid - mine out of bounds ignored', {r, c});
        }
    }

    for(let r = 0; r < rows; r++) {
        for(let c = 0; c < cols; c++) {
            if(grid?.[r]?.[c]?.isMine) continue;

            let count = 0;
            for(let dr = -1; dr <= 1; dr++) {
                for(let dc = -1; dc <= 1; dc++) {
                    if(dr === 0 && dc === 0) continue;
                    const nr = r + dr;
                    const nc = c + dc;
                    if(nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        if(mineSet.has(`${nr},${nc}`)) count++;
                    }
                }
            }

            const row = grid[r];
            if (!row) {
                console.error('[engine] computeSolutionGrid - invalid row', { r });
                throw new Error(`Invalid board state: row ${r} is undefined`);
            }

            const cell = row[c];
            if (!cell) {
                console.error('[engine] computeSolutionGrid - invalid cell', { r, c });
                throw new Error(`Invalid board state: cell at (${r}, ${c}) is undefined`);
            }

            cell.adjacentMines = count;
        }
    }

    logGridInfo(rows, cols, minePositions, grid);
    logEnd("computeSolutionGrid", start, { totalCells: rows * cols });
    return grid;
}

function floodFillOpen(grid: ComputedCell[][], startR: number, startC: number, opened: Set<string>): Array<{r: number; c: number; adj: number}> {
    const start = logStart("floodFillOpen", { startR, startC });
    if (!grid || grid.length === 0 || !grid[0]) {
        console.error('[engine] floodFillOpen - invalid grid');
        throw new Error("grid must have at least one row");
    }

    const rows = grid.length;
    const cols = grid[0].length;
    const result: Array<{r: number; c: number; adj: number}> = [];
    const queue: Array<[number, number]> = [[startR, startC]];
    const visited = new Set<string>();

    while(queue.length > 0) {
        const [r, c] = queue.shift()!;
        const key = `${r},${c}`;

        if(visited.has(key) || opened.has(key)) continue;
        visited.add(key);
        opened.add(key);

        const row = grid[r];
        if (!row) {
            console.error('[engine] floodFillOpen - invalid row index', { r });
            throw new Error(`Invalid grid row index: ${r}`);
        }
        const cell = row[c];
        if (!cell) {
            console.error('[engine] floodFillOpen - invalid column index', { r, c });
            throw new Error(`Invalid grid column index: ${c} (row ${r})`);
        }
        result.push({ r, c, adj: cell.adjacentMines });

        if(cell.adjacentMines > 0) continue;

        for(let dr = -1; dr <= 1; dr++) {
            for(let dc = -1; dc <= 1; dc++) {
                if(dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if(nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const nkey = `${nr},${nc}`;
                    const neighbor = grid[nr]?.[nc];
                    if (neighbor && !visited.has(nkey) && !opened.has(nkey) && !neighbor.isMine) {
                        queue.push([nr, nc]);
                    }
                }
            }
        }
    }

    logEnd("floodFillOpen", start, { openedCount: result.length });
    return result;
}

/** Builds a snapshot by replaying actions up to `upto` index.
 * Respects permanent flags - they are always included in flagged list.
 */
function stepToSnapshot(g: GameSession, upto: number): Snapshot {
    const start = logStart("stepToSnapshot", { gameId: g.id, upto, actionsTotal: g.actions.length });

    const opened = new Set<string>();
    const flagged = new Set<string>();
    const openedList: Array<{r: number; c: number; adj: number}> = [];
    const flaggedList: Array<{r: number; c: number}> = [];
    let lostOn: {r: number; c: number} | undefined;
    let cleared = false;

    if(!g.solutionGrid) {
        console.debug('[engine] stepToSnapshot - computing solution grid on demand');
        g.solutionGrid = computeSolutionGrid(g.rows, g.cols, g.minePositions);
    }

    console.groupCollapsed(`[stepToSnapshot] processing up to ${upto} actions for game ${g.id}`);
    try {
        for(let i = 0; i < upto; i++) {
            const a = g.actions[i];
            if(!a) {
                console.debug(`[stepToSnapshot] action[${i}] - empty/undefined, skipping`);
                continue;
            }

            console.groupCollapsed(`[stepToSnapshot] action[${i}] type=${a.type}`);
            try {
                console.debug('action payload:', a);

                if(a.type === "flag") {
                    const key = `${a.row},${a.column}`;

                    // Permanent flags cannot be toggled off
                    if(g.permanentFlags.has(key)) {
                        flagged.add(key);
                        console.debug(`[stepToSnapshot] action[${i}] flag action on permanent flag - keeping flagged -> ${key}`);
                        console.groupEnd();
                        continue;
                    }

                    const shouldSet = a.set !== undefined ? a.set : !flagged.has(key);

                    if(shouldSet) {
                        flagged.add(key);
                        console.debug(`[stepToSnapshot] action[${i}] flag set -> ${key}`);
                    } else {
                        flagged.delete(key);
                        console.debug(`[stepToSnapshot] action[${i}] flag removed -> ${key}`);
                    }
                }
                else if(a.type === "reveal") {
                    const key = `${a.row},${a.column}`;

                    if(opened.has(key)) {
                        console.debug(`[stepToSnapshot] action[${i}] reveal skipped, already opened -> ${key}`);
                        console.groupEnd();
                        continue;
                    }

                    const cell = getSolutionCell(g, a.row, a.column);
                    if (!cell) {
                        console.error('[engine] stepToSnapshot - invalid reveal coords', { idx: i, row: a.row, column: a.column });
                        throw new Error(`Invalid solutionGrid coordinates: ${a.row},${a.column}`);
                    }

                    if(cell.isMine) {
                        opened.add(key);
                        openedList.push({r: a.row, c: a.column, adj: 0});
                        lostOn = {r: a.row, c: a.column};
                        console.debug(`[stepToSnapshot] action[${i}] mine revealed -> ${key}`);
                        console.groupEnd();
                        continue;
                    }

                    const newlyOpened = floodFillOpen(g.solutionGrid, a.row, a.column, opened);
                    openedList.push(...newlyOpened);
                    console.debug(`[stepToSnapshot] action[${i}] revealed ${newlyOpened.length} cells`, newlyOpened.slice(0,10));
                }
                else {
                    console.warn('[engine] stepToSnapshot - unknown action type', { action: a });
                }
            }
            catch(e) {
                console.error('[engine] stepToSnapshot - error processing action', { idx: i, action: a, error: e });
                console.groupEnd();
                throw e;
            }
            console.groupEnd();
        }
    }
    finally {
        console.groupEnd();
    }

    // Add permanent flags to flagged set
    for (const permKey of g.permanentFlags) {
        flagged.add(permKey);
    }

    // Build flagged list
    for (const key of flagged) {
        const [rs = '', cs = ''] = key.split(',');
        const r = Number(rs);
        const c = Number(cs);
        if (!Number.isFinite(r) || !Number.isFinite(c)) {
            console.warn('[stepToSnapshot] flagged key parse failed', key);
            continue;
        }
        flaggedList.push({ r, c });
    }

    // Build permanent flags list
    const permanentFlagsList = Array.from(g.permanentFlags).map(key => {
        const [rs, cs] = key.split(',');
        return { r: Number(rs), c: Number(cs) };
    });

    // Check win condition
    const totalCells = g.rows * g.cols;
    const totalMines = g.minePositions.length;
    if(opened.size === totalCells - totalMines && !lostOn) {
        cleared = true;
    }

    const snapshot: Snapshot = {
        opened: openedList,
        flagged: flaggedList,
        permanentFlags: permanentFlagsList,
        lostOn,
        cleared
    };

    logEnd("stepToSnapshot", start, { opened: openedList.length, flagged: flaggedList.length, permanentFlags: permanentFlagsList.length, lostOn: !!lostOn, cleared });
    console.info('[stepToSnapshot] summary', {
        gameId: g.id,
        upto,
        openedCount: openedList.length,
        flaggedCount: flaggedList.length,
        permanentFlagsCount: permanentFlagsList.length,
        lostOn: lostOn ? lostOn : null,
        cleared
    });

    return snapshot;
}

function getSolutionCell<CellType>(g: { solutionGrid?: CellType[][] }, row: number, col: number): CellType | undefined {
    if(!g.solutionGrid) {
        console.warn('[engine] getSolutionCell - no solutionGrid present');
        return undefined;
    }
    const grid = g.solutionGrid;
    if (row < 0 || row >= grid.length) {
        console.debug('[engine] getSolutionCell - row OOB', { row, max: grid.length - 1 });
        return undefined;
    }
    const r = grid[row];
    if (!r) {
        console.debug('[engine] getSolutionCell - row undefined', { row });
        return undefined;
    }
    if (col < 0 || col >= r.length) {
        console.debug('[engine] getSolutionCell - col OOB', { col, max: r.length - 1 });
        return undefined;
    }
    return r[col];
}

function ensureFirstClickSafe(g: GameSession, clickR: number, clickC: number): void {
    const start = logStart("ensureFirstClickSafe", { gameId: g.id, clickR, clickC });

    // Define forbidden area (3×3 around click)
    const forbidden = new Set<string>();
    for(let dr = -1; dr <= 1; dr++) {
        for(let dc = -1; dc <= 1; dc++) {
            const nr = clickR + dr;
            const nc = clickC + dc;
            if(nr >= 0 && nr < g.rows && nc >= 0 && nc < g.cols) {
                forbidden.add(`${nr},${nc}`);
            }
        }
    }

    // Generate available positions
    const available: Array<[number, number]> = [];
    for(let r = 0; r < g.rows; r++) {
        for(let c = 0; c < g.cols; c++) {
            if(!forbidden.has(`${r},${c}`)) {
                available.push([r, c]);
            }
        }
    }

    if(available.length < g.mines) {
        console.error('[engine] ensureFirstClickSafe - not enough space for mines outside forbidden zone');
        throw new Error("Cannot place all mines outside first click area");
    }

    // Randomly select positions for mines
    const shuffled = available.sort(() => Math.random() - 0.5);
    const newPositions = shuffled.slice(0, g.mines);

    g.minePositions = newPositions;
    g.solutionGrid = computeSolutionGrid(g.rows, g.cols, newPositions);

    // Verify clicked cell has adjacentMines === 0
    const clickedCell = getSolutionCell(g, clickR, clickC);
    if(!clickedCell || clickedCell.adjacentMines !== 0) {
        console.warn('[engine] ensureFirstClickSafe - clicked cell still has adjacent mines', {
            clickR, clickC,
            adj: clickedCell?.adjacentMines
        });
    }

    logEnd("ensureFirstClickSafe", start, { minesPlaced: newPositions.length });
}

export function createGame(payload: Partial<GameOptions>): GameView {
    const start = logStart("createGame", { payload });

    if(!payload.rows || !payload.cols || payload.mines == null) {
        console.error('[engine] createGame - missing rows/cols/mines', { payload });
        throw new Error("Missing rows/cols/mines");
    }
    if(payload.rows <= 0 || payload.cols <= 0) {
        console.error('[engine] createGame - invalid dims', { payload });
        throw new Error("rows/cols must be positive");
    }
    if(payload.mines < 0 || payload.mines >= payload.rows * payload.cols) {
        console.error('[engine] createGame - invalid mines count', { payload });
        throw new Error("invalid mines count");
    }

    const id = randomUUID();
    const livesValue = payload.lives ?? 0;

    const g: GameSession = {
        id,
        rows: payload.rows,
        cols: payload.cols,
        mines: payload.mines,
        permanentFlags: new Set(),
        minePositions: [],
        solutionGrid: [] as ComputedCell[][],
        livesTotal: livesValue,
        livesLeft: livesValue,
        quickFlag: false,
        status: "new",
        actions: [],
        cursor: 0,
        pausedDuration: 0
    };

    mem.set(id, g);
    logEnd("createGame", start, { gameId: id });
    return summarize(g);
}

function summarize(g: GameSession): GameView {
    const start = logStart("summarize", { gameId: g.id, cursor: g.cursor, actions: g.actions.length });

    // Special case: brand new game
    if(g.status === "new" && g.cursor === 0 && g.minePositions.length === 0) {
        logEnd("summarize", start, { gameId: g.id, status: "new" });
        return {
            gameId: g.id,
            rows: g.rows,
            cols: g.cols,
            mines: g.mines,
            status: "new",
            board: {
                opened: [],
                flagged: [],
                permanentFlags: [],
                lostOn: undefined,
                mines: []
            },
            lives: { total: g.livesTotal, left: g.livesLeft },
            quickFlag: g.quickFlag,
            cursor: 0,
            totalActions: 0,
            elapsedTime: 0
        };
    }

    const s = stepToSnapshot(g, g.cursor);
    g.lastSnapshot = s;

    const oldStatus = g.status;

    // Determine status based on snapshot
    if(s.cleared) {
        g.status = "won";
    }
    else if(s.lostOn) {
        // Infinite lives mode - never game over from mines
        if(g.livesTotal === 0) {
            g.status = "playing";
        } else {
            // Finite lives mode - check lives left
            g.status = g.livesLeft > 0 ? "playing" : "lost";
        }
    }
    else {
        g.status = g.cursor === 0 ? "new" : "playing";
    }

    // Pause timer when game ends
    if((g.status === "won" || g.status === "lost") &&
       (oldStatus !== "won" && oldStatus !== "lost") &&
       !g.lastPauseStart) {
        g.lastPauseStart = Date.now();
        console.debug('[engine] summarize - game ended, timer paused', { status: g.status });
    }

    const view = maskGameViewForClient(g, s);
    logEnd("summarize", start, { gameId: g.id, oldStatus, newStatus: g.status });
    return view;
}

export function getGame(id: string): GameView {
    const start = logStart("getGame", { gameId: id });
    const g = mem.get(id);
    if(!g) {
        console.error('[engine] getGame - not found', { gameId: id });
        throw new Error("not found");
    }
    const view = summarize(g);
    logEnd("getGame", start, { gameId: id });
    return view;
}

export function reveal(id: string, r: number, c: number): GameView {
    const start = logStart("reveal", { gameId: id, r, c });
    const g = mem.get(id);
    if(!g) {
        console.error('[engine] reveal - not found', { gameId: id });
        throw new Error("not found");
    }

    // Block reveal on permanent flags
    const key = `${r},${c}`;
    if(g.permanentFlags.has(key)) {
        console.warn('[engine] reveal - blocked by permanent flag', { gameId: id, r, c });
        return summarize(g);
    }

    // Block if game is over
    if(g.status === "lost" || g.status === "won") {
        console.warn('[engine] reveal - game over', { gameId: id, status: g.status });
        throw new Error("game over");
    }

    // Resume timer if paused
    if(g.lastPauseStart) {
        g.pausedDuration += Date.now() - g.lastPauseStart;
        g.lastPauseStart = undefined;
        console.debug('[engine] reveal - timer resumed');
    }

    // Start timer on first move
    if(!g.startTime && g.cursor === 0) {
        g.startTime = Date.now();
        console.debug('[engine] reveal - timer started');
    }

    // Ensure first click is safe (engine keeps behaviour)
    if(g.cursor === 0 && g.minePositions.length === 0) {
        ensureFirstClickSafe(g, r, c);
    }

    // Trim future actions and add new one
    g.actions = g.actions.slice(0, g.cursor);
    g.actions.push({type: "reveal", row: r, column: c});
    g.cursor++;
    console.debug('[engine] reveal - action added', { cursor: g.cursor, totalActions: g.actions.length });

    // Check if this reveal hit a mine
    const cell = getSolutionCell(g, r, c);
    if(cell?.isMine) {
        console.debug('[engine] reveal - mine hit!', { r, c, livesLeftBefore: g.livesLeft });

        // Consume life only in finite lives mode
        if(g.livesTotal > 0) {
            g.livesLeft = Math.max(0, g.livesLeft - 1);
            console.debug("[engine] reveal - life consumed", {livesLeft: g.livesLeft});
        } else {
            console.debug("[engine] reveal - infinite lives mode, life not consumed");
        }

        // Pause timer (will stay paused until revive or game over)
        if(!g.lastPauseStart) {
            g.lastPauseStart = Date.now();
            console.debug("[engine] reveal - timer paused after explosion");
        }
    }

    const view = summarize(g);
    logEnd("reveal", start, { gameId: id, cursor: g.cursor, hitMine: !!cell?.isMine, livesLeft: g.livesLeft });
    return view;
}

export function flag(id: string, r: number, c: number, set?: boolean): GameView {
    const start = logStart("flag", { gameId: id, r, c, set });
    const g = mem.get(id);
    if(!g) {
        console.error('[engine] flag - not found', { gameId: id });
        throw new Error("not found");
    }

    // Cannot flag before first reveal
    if(g.status === "new") {
        console.warn('[engine] flag - cannot flag before first reveal', { gameId: id });
        throw new Error("Cannot place flags before first reveal");
    }

    // Block if game is over
    if(g.status === "lost" || g.status === "won") {
        console.warn('[engine] flag - game over', { gameId: id, status: g.status });
        throw new Error("game over");
    }

    // Cannot unflag permanent flags
    const key = `${r},${c}`;
    if(g.permanentFlags.has(key)) {
        console.warn('[engine] flag - cannot modify permanent flag', { gameId: id, r, c });
        return summarize(g);
    }

    // Resume timer if paused
    if(g.lastPauseStart) {
        g.pausedDuration += Date.now() - g.lastPauseStart;
        g.lastPauseStart = undefined;
        console.debug('[engine] flag - timer resumed');
    }

    // Start timer if this is somehow the first action (shouldn't happen due to status check)
    if(!g.startTime && g.cursor === 0) {
        g.startTime = Date.now();
        console.debug('[engine] flag - timer started');
    }

    // Trim future actions and add new one
    g.actions = g.actions.slice(0, g.cursor);
    g.actions.push({type: "flag", row: r, column: c, set});
    g.cursor++;
    console.debug('[engine] flag - action added', { cursor: g.cursor, totalActions: g.actions.length });

    logEnd("flag", start, { gameId: id, cursor: g.cursor });
    return summarize(g);
}

export function setMode(id: string, quickFlag: boolean) {
    const start = logStart("setMode", { gameId: id, quickFlag });
    const g = mem.get(id);
    if(!g) {
        console.error('[engine] setMode - not found', { gameId: id });
        throw new Error("not found");
    }
    g.quickFlag = quickFlag;
    logEnd("setMode", start, { gameId: id, quickFlag: g.quickFlag });
    return {ok: true, quickFlagEnabled: g.quickFlag};
}

export function undo(id: string, steps = 1): GameView {
    const start = logStart("undo", { gameId: id, steps });
    const g = mem.get(id);
    if(!g) {
        console.error('[engine] undo - not found', { gameId: id });
        throw new Error("not found");
    }

    // Cannot undo if no actions
    if(g.cursor === 0) {
        console.warn('[engine] undo - already at start', { gameId: id });
        return summarize(g);
    }

    const prevCursor = g.cursor;
    let targetCursor = Math.max(0, g.cursor - Math.max(1, steps));

    // Check if target snapshot has revealed mine - if so, skip one more back
    let checkSnapshot = stepToSnapshot(g, targetCursor);
    if(checkSnapshot.lostOn && targetCursor > 0) {
        console.debug('[engine] undo - target has revealed mine, skipping back one more', { targetCursor });
        targetCursor = Math.max(0, targetCursor - 1);
    }

    g.cursor = targetCursor;
    console.debug('[engine] undo - cursor changed', { prevCursor, newCursor: g.cursor });

    // Note: Undo does NOT trim actions - they remain for potential redo
    // Note: Undo does NOT change lives
    // Note: Timer keeps running

    logEnd("undo", start, { gameId: id, cursor: g.cursor });
    return summarize(g);
}

export function seek(id: string, toIndex: number, isPreview = false): GameView {
    const start = logStart(isPreview ? "preview" : "seek", { gameId: id, toIndex, isPreview });
    const g = mem.get(id);
    if(!g) {
        console.error(`[engine] ${isPreview ? "preview" : "seek"} - not found`, { gameId: id });
        throw new Error("not found");
    }

    const targetCursor = Math.min(Math.max(0, toIndex), g.actions.length);
    console.debug(`[engine] ${isPreview ? "preview" : "seek"} - target cursor`, { targetCursor, actualCursor: g.cursor });

    if (!isPreview) {
        // Seek mění stav hry
        g.cursor = targetCursor;
        logEnd("seek", start, { gameId: id, cursor: g.cursor });
        return summarize(g);
    }

    // Preview negeneruje snapshot bez změny stavu
    const s = stepToSnapshot(g, targetCursor);

    const view: GameView = {
        gameId: g.id,
        rows: g.rows,
        cols: g.cols,
        mines: g.mines,
        status: g.status,
        lives: {left: g.livesLeft, total: g.livesTotal},
        quickFlag: g.quickFlag,
        cursor: targetCursor,
        totalActions: g.actions.length,
        elapsedTime: 0,
        board: {
            opened: s.opened,
            flagged: s.flagged,
            permanentFlags: s.permanentFlags || [],
            lostOn: s.lostOn,
            cleared: s.cleared,
            mines: (s.lostOn || s.cleared)
                   ? g.minePositions.map(([r, c]) => ({r, c}))
                   : undefined
        },
        isPreview: true,
        previewIndex: targetCursor
    };

    logEnd("preview", start, { gameId: id, previewCursor: targetCursor });
    return view;
}

export function preview(id: string, toIndex: number): GameView {
    return seek(id, toIndex, true);
}

export function revive(id: string, toIndex?: number): GameView {
    const start = logStart("revive", { gameId: id, toIndex });
    const g = mem.get(id);
    if(!g) {
        console.error('[engine] revive - not found', { gameId: id });
        throw new Error("not found");
    }

    if(g.livesTotal > 0 && g.livesLeft <= 0) {
        console.warn('[engine] revive - no lives left', { gameId: id });
        throw new Error("no lives left");
    }

    // Find last mine explosion
    let lostIndex = -1;
    let lostCell: {r: number; c: number} | null = null;

    for(let i = g.actions.length - 1; i >= 0; i--) {
        const a = g.actions[i];
        if(a && a.type === "reveal") {
            const cell = getSolutionCell(g, a.row, a.column);
            if(cell?.isMine) {
                lostIndex = i;
                lostCell = {r: a.row, c: a.column};
                break;
            }
        }
    }

    if(!lostCell) {
        console.warn('[engine] revive - no explosion found', { gameId: id });
        throw new Error("No explosion to revive from");
    }

    console.debug('[engine] revive - found explosion', { lostIndex, lostCell });

    // Determine target index (EXCLUSIVE - trim BEFORE this action)
    let targetIndex: number;
    if(toIndex !== undefined) {
        targetIndex = Math.min(Math.max(0, toIndex), lostIndex); // Clamp to lostIndex max
    } else {
        targetIndex = lostIndex; // go back to state BEFORE mine reveal
    }

    // Trim to state BEFORE target
    g.actions = g.actions.slice(0, targetIndex);

    // Add permanent flag
    const mineKey = `${lostCell.r},${lostCell.c}`;
    g.permanentFlags.add(mineKey);
    console.debug('[engine] revive - added permanent flag', { mineKey });

    // Now add flag action AFTER trimming
    g.actions.push({type: "flag", row: lostCell.r, column: lostCell.c, set: true});
    g.cursor = g.actions.length;

    // Resume timer
    if(g.lastPauseStart) {
        g.pausedDuration += Date.now() - g.lastPauseStart;
        g.lastPauseStart = undefined;
        console.debug('[engine] revive - timer resumed');
    }

    g.status = "playing";

    const view = summarize(g);
    logEnd("revive", start, { cursor: g.cursor, livesLeft: g.livesLeft });
    return {...view, status: "playing"};
}

export function hint(id: string) {
    const start = logStart("hint", { gameId: id });
    const g = mem.get(id);
    if(!g) {
        console.error('[engine] hint - not found', { gameId: id });
        throw new Error("not found");
    }

    const s = g.lastSnapshot ?? stepToSnapshot(g, g.cursor);
    const openedSet = new Set(s.opened.map((o) => `${o.r},${o.c}`));
    const flaggedSet = new Set(s.flagged.map((f) => `${f.r},${f.c}`));
    const hiddenMines = g.minePositions.filter(([r, c]) => !openedSet.has(`${r},${c}`));

    console.debug('[engine] hint - hiddenMines count', { count: hiddenMines.length });

    if(hiddenMines.length === 0) {
        logEnd("hint", start, { result: "none" });
        return {type: "none"} as const;
    }

    // Find most useful mine: closest to opened cells and not flagged
    let bestMine: [number, number] | null = null;
    let bestScore = -1;

    for(const [mr, mc] of hiddenMines) {
        if(flaggedSet.has(`${mr},${mc}`)) continue; // Skip already flagged

        let adjacentOpenCount = 0;
        for(let dr = -1; dr <= 1; dr++) {
            for(let dc = -1; dc <= 1; dc++) {
                if(dr === 0 && dc === 0) continue;
                const nr = mr + dr;
                const nc = mc + dc;
                if(nr >= 0 && nr < g.rows && nc >= 0 && nc < g.cols) {
                    if(openedSet.has(`${nr},${nc}`)) {
                        adjacentOpenCount++;
                    }
                }
            }
        }

        // Score: more opened neighbors = more useful hint
        // Add position as tiebreaker for determinism
        const score = adjacentOpenCount * 10000 + mr * 100 + mc;
        if(score > bestScore) {
            bestScore = score;
            bestMine = [mr, mc];
        }
    }

    // If none near opened cells, take first unflagged (deterministic)
    if(!bestMine) {
        bestMine = hiddenMines.find(([r, c]) => !flaggedSet.has(`${r},${c}`)) ?? hiddenMines[0]!;
    }

    const [mr, mc] = bestMine;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const r0 = clamp(mr - 1, 0, g.rows - 1);
    const r1 = clamp(mr + 1, 0, g.rows - 1);
    const c0 = clamp(mc - 1, 0, g.cols - 1);
    const c1 = clamp(mc + 1, 0, g.cols - 1);

    const rect = {r0, c0, r1, c1};
    logEnd("hint", start, { selectedMine: [mr, mc], rect, score: bestScore });
    return {type: "mine-area", rect} as const;
}
