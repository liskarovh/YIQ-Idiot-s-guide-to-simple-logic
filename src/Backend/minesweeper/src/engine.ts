import {randomUUID} from "crypto";
import {maskGameViewForClient, fisherYatesShuffle} from "./util.js";
import type {ComputedCell, GameOptions, GameSession, GameView, Snapshot} from "./types.js";

const map = new Map<string, GameSession>();

function nowMs() { return Date.now(); }

function logStart(functionName: string, meta?: any) {
    console.debug(`[engine] START ${functionName}`, meta ?? {});
    return nowMs();
}

function logEnd(fileName: string, start: number, meta?: any) {
    const duration = Math.round(nowMs() - start);
    console.debug(`[engine] END   ${fileName}`, {...(meta ?? {}), durationMs: duration});
}

function renderSolutionMap(grid: ComputedCell[][]): string[] {
    return grid.map(row =>
                        row.map(cell => (cell.isMine ? "*" : (cell.adjacentMines > 0 ? String(cell.adjacentMines) : "."))).join("")
    );
}

function logGridInfo(rows: number, cols: number, minePositions: Array<[number, number]>, grid: ComputedCell[][]) {
    try {
        console.groupCollapsed("[engine] Grid info");
        console.debug("size", `${rows}x${cols}`);
        console.debug("minePositions count", minePositions.length, minePositions);
        console.debug("rendered map:");
        for(const line of renderSolutionMap(grid)) {
            console.debug(line);
        }
        const counts: Record<string, number> = {};
        for(let iRow = 0; iRow < grid.length; iRow++) {
            const row = grid[iRow];
            if(!row) {
                continue;
            }
            for(let iCol = 0; iCol < row.length; iCol++) {
                const cell = row[iCol];
                if(!cell) {
                    continue;
                }
                const key = cell.isMine ? "mine" : String(cell.adjacentMines);
                counts[key] = (counts[key] || 0) + 1;
            }
        }
        console.debug("cell counts", counts);
        console.groupEnd();
    }
    catch(e) {
        console.error("[engine] logGridInfo error", e);
    }
}

function computeSolutionGrid(rows: number, cols: number, minePositions: Array<[number, number]>): ComputedCell[][] {
    const start = logStart("computeSolutionGrid", {rows, cols, mines: minePositions.length});

    const grid: ComputedCell[][] = Array.from({length: rows}, () =>
        Array.from({length: cols}, () => ({
            isMine: false,
            adjacentMines: 0
        }))
    );

    const mineSet = new Set<string>();
    for(const [row, col] of minePositions) {
        if(row >= 0 && row < rows && col >= 0 && col < cols) {
            const cell = grid[row]?.[col];
            if(cell) {
                cell.isMine = true;
            }
            mineSet.add(`${row},${col}`);
        }
        else {
            console.warn("[engine] computeSolutionGrid - mine out of bounds ignored", {row, col});
        }
    }

    for(let iRow = 0; iRow < rows; iRow++) {
        for(let iCol = 0; iCol < cols; iCol++) {
            if(grid?.[iRow]?.[iCol]?.isMine) {
                continue;
            }

            let count = 0;
            for(let deltaRow = -1; deltaRow <= 1; deltaRow++) {
                for(let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                    if(deltaRow === 0 && deltaCol === 0) {
                        continue;
                    }
                    const resultRow = iRow + deltaRow;
                    const resultCol = iCol + deltaCol;
                    if(resultRow >= 0 && resultRow < rows && resultCol >= 0 && resultCol < cols) {
                        if(mineSet.has(`${resultRow},${resultCol}`)) {
                            count++;
                        }
                    }
                }
            }

            const row = grid[iRow];
            if(!row) {
                console.error("[engine] computeSolutionGrid - invalid row", {iRow});
                throw new Error(`Invalid board state: row ${iRow} is undefined`);
            }

            const cell = row[iCol];
            if(!cell) {
                console.error("[engine] computeSolutionGrid - invalid cell", {iRow, iCol});
                throw new Error(`Invalid board state: cell at (${iRow}, ${iCol}) is undefined`);
            }

            cell.adjacentMines = count;
        }
    }

    logGridInfo(rows, cols, minePositions, grid);
    logEnd("computeSolutionGrid", start, {totalCells: rows * cols});
    return grid;
}

function floodFillOpen(grid: ComputedCell[][], startRow: number, startCol: number, opened: Set<string>): Array<{ row: number; col: number; adjacent: number }> {
    const start = logStart("floodFillOpen", {startRow, startCol});
    if(!grid || grid.length === 0 || !grid[0]) {
        console.error("[engine] floodFillOpen - invalid grid");
        throw new Error("grid must have at least one row");
    }

    const rows = grid.length;
    const cols = grid[0].length;
    const result: Array<{ row: number; col: number; adjacent: number }> = [];
    const queue: Array<[number, number]> = [[startRow, startCol]];
    const visited = new Set<string>();

    while(queue.length > 0) {
        const [rowIdx, coldx] = queue.shift()!;
        const key = `${rowIdx},${coldx}`;

        if(visited.has(key) || opened.has(key)) {
            continue;
        }
        visited.add(key);
        opened.add(key);

        const row = grid[rowIdx];
        if(!row) {
            console.error("[engine] floodFillOpen - invalid row index", {rowIdx});
            throw new Error(`Invalid grid row index: ${rowIdx}`);
        }
        const cell = row[coldx];
        if(!cell) {
            console.error("[engine] floodFillOpen - invalid column index", {rowIdx, coldx});
            throw new Error(`Invalid grid column index: ${coldx} (row ${rowIdx})`);
        }
        result.push({row: rowIdx, col: coldx, adjacent: cell.adjacentMines});

        if(cell.adjacentMines > 0) {
            continue;
        }

        for(let deltaRow = -1; deltaRow <= 1; deltaRow++) {
            for(let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                if(deltaRow === 0 && deltaCol === 0) {
                    continue;
                }
                const resultRow = rowIdx + deltaRow;
                const resultCol = coldx + deltaCol;
                if(resultRow >= 0 && resultRow < rows && resultCol >= 0 && resultCol < cols) {
                    const resultKey = `${resultRow},${resultCol}`;
                    const neighbour = grid[resultRow]?.[resultCol];
                    if(neighbour && !visited.has(resultKey) && !opened.has(resultKey) && !neighbour.isMine) {
                        queue.push([resultRow, resultCol]);
                    }
                }
            }
        }
    }

    logEnd("floodFillOpen", start, {openedCount: result.length});
    return result;
}

/** Builds a snapshot by replaying actions up to `upto` index.
 * Respects permanent flags - they are always included in flagged list.
 */
function stepToSnapshot(gameSession: GameSession, uptoAction: number): Snapshot {
    const start = logStart("stepToSnapshot", {gameId: gameSession.id, uptoAction, actionsTotal: gameSession.actions.length});

    const opened = new Set<string>();
    const flagged = new Set<string>();
    const openedList: Array<{ row: number; col: number; adjacent: number }> = [];
    const flaggedList: Array<{ row: number; col: number }> = [];
    let lostOn: { row: number; col: number } | undefined;
    let cleared = false;

    if(!gameSession.solutionGrid) {
        console.debug("[engine] stepToSnapshot - computing solution grid on demand");
        gameSession.solutionGrid = computeSolutionGrid(gameSession.rows, gameSession.cols, gameSession.minePositions);
    }

    console.groupCollapsed(`[stepToSnapshot] processing up to ${uptoAction} actions for game ${gameSession.id}`);
    try {
        for(let iAction = 0; iAction < uptoAction; iAction++) {
            const action = gameSession.actions[iAction];
            if(!action) {
                console.debug(`[stepToSnapshot] action[${iAction}] - empty/undefined, skipping`);
                continue;
            }

            console.groupCollapsed(`[stepToSnapshot] action[${iAction}] type=${action.type}`);
            try {
                console.debug("action payload:", action);

                if(action.type === "flag") {
                    const key = `${action.row},${action.col}`;

                    // Permanent flags cannot be toggled off
                    if(gameSession.permanentFlags.has(key)) {
                        flagged.add(key);
                        console.debug(`[stepToSnapshot] action[${iAction}] flag action on permanent flag - keeping flagged -> ${key}`);
                        console.groupEnd();
                        continue;
                    }

                    const shouldSet = action.set !== undefined ? action.set : !flagged.has(key);

                    if(shouldSet) {
                        flagged.add(key);
                        console.debug(`[stepToSnapshot] action[${iAction}] flag set -> ${key}`);
                    }
                    else {
                        flagged.delete(key);
                        console.debug(`[stepToSnapshot] action[${iAction}] flag removed -> ${key}`);
                    }
                }
                else if(action.type === "reveal") {
                    const key = `${action.row},${action.col}`;

                    if(opened.has(key)) {
                        console.debug(`[stepToSnapshot] action[${iAction}] reveal skipped, already opened -> ${key}`);
                        console.groupEnd();
                        continue;
                    }

                    const cell = getSolutionCell(gameSession, action.row, action.col);
                    if(!cell) {
                        console.error("[engine] stepToSnapshot - invalid reveal coords", {idx: iAction, row: action.row, col: action.col});
                        throw new Error(`Invalid solutionGrid coordinates: ${action.row},${action.col}`);
                    }

                    if(cell.isMine) {
                        opened.add(key);
                        openedList.push({row: action.row, col: action.col, adjacent: 0});
                        lostOn = {row: action.row, col: action.col};
                        console.debug(`[stepToSnapshot] action[${iAction}] mine revealed -> ${key}`);
                        console.groupEnd();
                        continue;
                    }

                    const newlyOpened = floodFillOpen(gameSession.solutionGrid, action.row, action.col, opened);
                    openedList.push(...newlyOpened);
                    console.debug(`[stepToSnapshot] action[${iAction}] revealed ${newlyOpened.length} cells`, newlyOpened.slice(0, 10));
                }
                else {
                    console.warn("[engine] stepToSnapshot - unknown action type", {action: action});
                }
            }
            catch(e) {
                console.error("[engine] stepToSnapshot - error processing action", {idx: iAction, action: action, error: e});
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
    for(const permanentFlag of gameSession.permanentFlags) {
        flagged.add(permanentFlag);
    }

    // Build flagged list
    for(const key of flagged) {
        const [rowString = "", colString = ""] = key.split(",");
        const row = Number(rowString);
        const col = Number(colString);
        if(!Number.isFinite(row) || !Number.isFinite(col)) {
            console.warn("[stepToSnapshot] flagged key parse failed", key);
            continue;
        }
        flaggedList.push({row, col});
    }

    // Build permanent flags list
    const permanentFlagsList = Array.from(gameSession.permanentFlags).map(key => {
        const [rowString, colString] = key.split(",");
        return {row: Number(rowString), col: Number(colString)};
    });

    // Check win condition
    const totalCells = gameSession.rows * gameSession.cols;
    const totalMines = gameSession.minePositions.length;

    // Build set of mine keys for exact-match check
    const mineSet = new Set(gameSession.minePositions.map(([row, col]) => `${row},${col}`));

    // Require that flagged set exactly equals mine set (no extra or missing flags)
    let allMinesFlagged = false;
    if(mineSet.size === flagged.size) {
        allMinesFlagged = true;
        for(const m of mineSet) {
            if(!flagged.has(m)) {
                allMinesFlagged = false;
                break;
            }
        }
    }

    // Win only when all non-mine cells are opened and all mines are correctly flagged
    if(opened.size === totalCells - totalMines && !lostOn && allMinesFlagged) {
        cleared = true;
    }

    const snapshot: Snapshot = {
        opened: openedList,
        flagged: flaggedList,
        permanentFlags: permanentFlagsList,
        lostOn,
        cleared
    };

    logEnd("stepToSnapshot", start, {opened: openedList.length, flagged: flaggedList.length, permanentFlags: permanentFlagsList.length, lostOn: !!lostOn, cleared});
    console.info("[stepToSnapshot] summary", {
        gameId: gameSession.id,
        upto: uptoAction,
        openedCount: openedList.length,
        flaggedCount: flaggedList.length,
        permanentFlagsCount: permanentFlagsList.length,
        lostOn: lostOn ? lostOn : null,
        cleared
    });

    return snapshot;
}

function getSolutionCell<CellType>(gameSession: { solutionGrid?: CellType[][] }, row: number, col: number): CellType | undefined {
    if(!gameSession.solutionGrid) {
        console.warn("[engine] getSolutionCell - no solutionGrid present");
        return undefined;
    }
    const grid = gameSession.solutionGrid;
    if(row < 0 || row >= grid.length) {
        console.debug("[engine] getSolutionCell - row OOB", {row, max: grid.length - 1});
        return undefined;
    }
    const gridRow = grid[row];
    if(!gridRow) {
        console.debug("[engine] getSolutionCell - row undefined", {row});
        return undefined;
    }
    if(col < 0 || col >= gridRow.length) {
        console.debug("[engine] getSolutionCell - col OOB", {col, max: gridRow.length - 1});
        return undefined;
    }
    return gridRow[col];
}

function ensureFirstClickSafe(gameSession: GameSession, clickRow: number, clickCol: number): void {
    const start = logStart("ensureFirstClickSafe", {gameId: gameSession.id, clickRow, clickCol});

    // Define forbidden area (3×3 around click)
    const forbidden = new Set<string>();
    for(let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for(let deltaCol = -1; deltaCol <= 1; deltaCol++) {
            const resultRow = clickRow + deltaRow;
            const resultCol = clickCol + deltaCol;
            if(resultRow >= 0 && resultRow < gameSession.rows && resultCol >= 0 && resultCol < gameSession.cols) {
                forbidden.add(`${resultRow},${resultCol}`);
            }
        }
    }

    // Generate available positions
    const available: Array<[number, number]> = [];
    for(let iRow = 0; iRow < gameSession.rows; iRow++) {
        for(let iCol = 0; iCol < gameSession.cols; iCol++) {
            if(!forbidden.has(`${iRow},${iCol}`)) {
                available.push([iRow, iCol]);
            }
        }
    }

    const needMines = gameSession.mines;
    const maxZeroRegion = Math.min(Math.max(1, Math.floor((gameSession.rows * gameSession.cols) * 0.10)), 128); // 10% of board, capped
    const attempts = 12;

    // If not enough space outside forbidden zone, fall back to global placement excluding clicked cell
    if(available.length < needMines) {
        console.warn("[engine] ensureFirstClickSafe - not enough space for mines outside forbidden zone, falling back to global placement excluding clicked cell", {
            availableOutside: available.length,
            mines: needMines
        });

        const allExceptClicked: Array<[number, number]> = [];
        for(let iRow = 0; iRow < gameSession.rows; iRow++) {
            for(let iCol = 0; iCol < gameSession.cols; iCol++) {
                if(iRow === clickRow && iCol === clickCol) {
                    continue;
                }
                allExceptClicked.push([iRow, iCol]);
            }
        }

        const chosen = pickPlacement(allExceptClicked, needMines, gameSession.rows, gameSession.cols, clickRow, clickCol, maxZeroRegion, attempts);
        if(chosen) {
            applyPlacement(gameSession, chosen, clickRow, clickCol, "fallback-limited-zero-region");
            logEnd("ensureFirstClickSafe", start, {minesPlaced: chosen.length, fallback: true, heuristic: "limited-zero-region"});
            return;
        }

        // Final random fallback
        const newPositionsFallback = fisherYatesShuffle(allExceptClicked).slice(0, needMines);
        applyPlacement(gameSession, newPositionsFallback, clickRow, clickCol, "final-fallback");
        logEnd("ensureFirstClickSafe", start, {minesPlaced: newPositionsFallback.length, fallback: true});
        return;
    }

    // Try several random placements and pick one that keeps flood-fill region small
    const chosen = pickPlacement(available, needMines, gameSession.rows, gameSession.cols, clickRow, clickCol, maxZeroRegion, attempts);
    if(chosen) {
        applyPlacement(gameSession, chosen, clickRow, clickCol, "limited-zero-region");
        logEnd("ensureFirstClickSafe", start, {minesPlaced: chosen.length, heuristic: "limited-zero-region"});
        return;
    }

    // If heuristic failed after attempts, fall back to previous simple behavior
    const newPositions = fisherYatesShuffle(available).slice(0, needMines);
    applyPlacement(gameSession, newPositions, clickRow, clickCol, "heuristic-failed");
    logEnd("ensureFirstClickSafe", start, {minesPlaced: newPositions.length});
}

export function createGame(payload: Partial<GameOptions>): GameView {
    const start = logStart("createGame", {payload});

    if(!payload.rows || !payload.cols || payload.mines == null) {
        console.error("[engine] createGame - missing rows/cols/mines", {payload});
        throw new Error("Missing rows/cols/mines");
    }
    if(payload.rows <= 0 || payload.cols <= 0) {
        console.error("[engine] createGame - invalid dims", {payload});
        throw new Error("rows/cols must be positive");
    }
    if(payload.mines < 0 || payload.mines >= payload.rows * payload.cols) {
        console.error("[engine] createGame - invalid mines count", {payload});
        throw new Error("invalid mines count");
    }

    const id = randomUUID();
    const livesValue = payload.lives ?? 0;

    const gameSession: GameSession = {
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

    map.set(id, gameSession);
    logEnd("createGame", start, {gameId: id});
    return summarize(gameSession);
}

function summarize(gameSession: GameSession): GameView {
    const start = logStart("summarize", {gameId: gameSession.id, cursor: gameSession.cursor, actions: gameSession.actions.length});

    // Special case: brand new game
    if(gameSession.status === "new" && gameSession.cursor === 0 && gameSession.minePositions.length === 0) {
        logEnd("summarize", start, {gameId: gameSession.id, status: "new"});
        return {
            gameId: gameSession.id,
            rows: gameSession.rows,
            cols: gameSession.cols,
            mines: gameSession.mines,
            status: "new",
            board: {
                opened: [],
                flagged: [],
                permanentFlags: [],
                lostOn: undefined,
                mines: []
            },
            lives: {
                total: gameSession.livesTotal,
                left: gameSession.livesLeft
            },
            quickFlag: gameSession.quickFlag,
            cursor: 0,
            totalActions: 0,
            elapsedTime: 0
        };
    }

    const snapshot = stepToSnapshot(gameSession, gameSession.cursor);
    gameSession.lastSnapshot = snapshot;

    const oldStatus = gameSession.status;

    // Determine status based on snapshot
    if(snapshot.cleared) {
        gameSession.status = "won";
    }
    else if(snapshot.lostOn) {
        // Infinite lives mode - never game over from mines
        if(gameSession.livesTotal === 0) {
            gameSession.status = "playing";
        }
        else {
            // Finite lives mode - check lives left
            gameSession.status = gameSession.livesLeft > 0 ? "playing" : "lost";
        }
    }
    else {
        gameSession.status = gameSession.cursor === 0 ? "new" : "playing";
    }

    // Pause timer when game ends
    if((gameSession.status === "won" || gameSession.status === "lost") &&
       (oldStatus !== "won" && oldStatus !== "lost") &&
       !gameSession.lastPauseStart) {
        gameSession.lastPauseStart = Date.now();
        console.debug("[engine] summarize - game ended, timer paused", {status: gameSession.status});
    }

    const view = maskGameViewForClient(gameSession, snapshot);
    logEnd("summarize", start, {gameId: gameSession.id, oldStatus, newStatus: gameSession.status});
    return view;
}

export function getGame(id: string): GameView {
    const start = logStart("getGame", {gameId: id});
    const gameSession = map.get(id);
    if(!gameSession) {
        console.error("[engine] getGame - not found", {gameId: id});
        throw new Error("not found");
    }
    const view = summarize(gameSession);
    logEnd("getGame", start, {gameId: id});
    return view;
}

export function reveal(id: string, row: number, col: number): GameView {
    const start = logStart("reveal", {gameId: id, row, col});
    const gameSession = map.get(id);
    if(!gameSession) {
        console.error("[engine] reveal - not found", {gameId: id});
        throw new Error("not found");
    }

    // Block reveal on permanent flags
    const key = `${row},${col}`;
    if(gameSession.permanentFlags.has(key)) {
        console.warn("[engine] reveal - blocked by permanent flag", {gameId: id, row, col});
        return summarize(gameSession);
    }

    // Block if game is over
    if(gameSession.status === "lost" || gameSession.status === "won") {
        console.warn("[engine] reveal - game over", {gameId: id, status: gameSession.status});
        throw new Error("game over");
    }

    // Resume timer if paused
    if(gameSession.lastPauseStart) {
        gameSession.pausedDuration += Date.now() - gameSession.lastPauseStart;
        gameSession.lastPauseStart = undefined;
        console.debug("[engine] reveal - timer resumed");
    }

    // Start timer on first move
    if(!gameSession.startTime && gameSession.cursor === 0) {
        gameSession.startTime = Date.now();
        console.debug("[engine] reveal - timer started");
    }

    // Ensure first click is safe (engine keeps behaviour)
    if(gameSession.cursor === 0 && gameSession.minePositions.length === 0) {
        ensureFirstClickSafe(gameSession, row, col);
    }

    // Trim future actions and add new one
    gameSession.actions = gameSession.actions.slice(0, gameSession.cursor);
    gameSession.actions.push({type: "reveal", row, col});
    gameSession.cursor++;
    console.debug("[engine] reveal - action added", {cursor: gameSession.cursor, totalActions: gameSession.actions.length});

    // Check if this reveal hit a mine
    const cell = getSolutionCell(gameSession, row, col);
    if(cell?.isMine) {
        console.debug("[engine] reveal - mine hit!", {row, col, livesLeftBefore: gameSession.livesLeft});

        // Consume life only in finite lives mode
        if(gameSession.livesTotal > 0) {
            gameSession.livesLeft = Math.max(0, gameSession.livesLeft - 1);
            console.debug("[engine] reveal - life consumed", {livesLeft: gameSession.livesLeft});
        }
        else {
            console.debug("[engine] reveal - infinite lives mode, life not consumed");
        }

        // Pause timer (will stay paused until revive or game over)
        if(!gameSession.lastPauseStart) {
            gameSession.lastPauseStart = Date.now();
            console.debug("[engine] reveal - timer paused after explosion");
        }
    }

    const view = summarize(gameSession);
    logEnd("reveal", start, {gameId: id, cursor: gameSession.cursor, hitMine: !!cell?.isMine, livesLeft: gameSession.livesLeft});
    return view;
}

export function flag(id: string, row: number, col: number, set?: boolean): GameView {
    const start = logStart("flag", {gameId: id, row, col, set});
    const gameSession = map.get(id);
    if(!gameSession) {
        console.error("[engine] flag - not found", {gameId: id});
        throw new Error("not found");
    }

    // Cannot flag before first reveal
    if(gameSession.status === "new") {
        console.warn("[engine] flag - cannot flag before first reveal", {gameId: id});
        throw new Error("Cannot place flags before first reveal");
    }

    // Block if game is over
    if(gameSession.status === "lost" || gameSession.status === "won") {
        console.warn("[engine] flag - game over", {gameId: id, status: gameSession.status});
        throw new Error("game over");
    }

    // Cannot unflag permanent flags
    const key = `${row},${col}`;
    if(gameSession.permanentFlags.has(key)) {
        console.warn("[engine] flag - cannot modify permanent flag", {gameId: id, row, col});
        return summarize(gameSession);
    }

    // Resume timer if paused
    if(gameSession.lastPauseStart) {
        gameSession.pausedDuration += Date.now() - gameSession.lastPauseStart;
        gameSession.lastPauseStart = undefined;
        console.debug("[engine] flag - timer resumed");
    }

    // Start timer if this is somehow the first action (shouldn't happen due to status check)
    if(!gameSession.startTime && gameSession.cursor === 0) {
        gameSession.startTime = Date.now();
        console.debug("[engine] flag - timer started");
    }

    // Trim future actions and add new one
    gameSession.actions = gameSession.actions.slice(0, gameSession.cursor);
    gameSession.actions.push({type: "flag", row, col, set});
    gameSession.cursor++;
    console.debug("[engine] flag - action added", {cursor: gameSession.cursor, totalActions: gameSession.actions.length});

    logEnd("flag", start, {gameId: id, cursor: gameSession.cursor});
    return summarize(gameSession);
}

export function setMode(id: string, quickFlag: boolean) {
    const start = logStart("setMode", {gameId: id, quickFlag});
    const gameSession = map.get(id);
    if(!gameSession) {
        console.error("[engine] setMode - not found", {gameId: id});
        throw new Error("not found");
    }
    gameSession.quickFlag = quickFlag;
    logEnd("setMode", start, {gameId: id, quickFlag: gameSession.quickFlag});
    return {ok: true, quickFlagEnabled: gameSession.quickFlag};
}

export function undo(id: string, steps = 1): GameView {
    const start = logStart("undo", {gameId: id, steps});
    const gameSession = map.get(id);
    if(!gameSession) {
        console.error("[engine] undo - not found", {gameId: id});
        throw new Error("not found");
    }

    // Cannot undo if no actions
    if(gameSession.cursor === 0) {
        console.warn("[engine] undo - already at start", {gameId: id});
        return summarize(gameSession);
    }

    const prevCursor = gameSession.cursor;
    let targetCursor = Math.max(0, gameSession.cursor - Math.max(1, steps));

    // Check if target snapshot has revealed mine - if so, skip one more back
    let checkSnapshot = stepToSnapshot(gameSession, targetCursor);
    if(checkSnapshot.lostOn && targetCursor > 0) {
        console.debug("[engine] undo - target has revealed mine, skipping back one more", {targetCursor});
        targetCursor = Math.max(0, targetCursor - 1);
    }

    gameSession.cursor = targetCursor;
    console.debug("[engine] undo - cursor changed", {prevCursor, newCursor: gameSession.cursor});

    // Note: Undo does NOT trim actions - they remain for potential redo
    // Note: Undo does NOT change lives
    // Note: Timer keeps running

    logEnd("undo", start, {gameId: id, cursor: gameSession.cursor});
    return summarize(gameSession);
}

export function seek(id: string, toIndex: number, isPreview = false): GameView {
    const start = logStart(isPreview ? "preview" : "seek", {gameId: id, toIndex, isPreview});
    const gameSession = map.get(id);
    if(!gameSession) {
        console.error(`[engine] ${isPreview ? "preview" : "seek"} - not found`, {gameId: id});
        throw new Error("not found");
    }

    const targetCursor = Math.min(Math.max(0, toIndex), gameSession.actions.length);
    console.debug(`[engine] ${isPreview ? "preview" : "seek"} - target cursor`, {targetCursor, actualCursor: gameSession.cursor});

    if(!isPreview) {
        // Seek mění stav hry
        gameSession.cursor = targetCursor;
        logEnd("seek", start, {gameId: id, cursor: gameSession.cursor});
        return summarize(gameSession);
    }

    // Preview negeneruje snapshot bez změny stavu
    const s = stepToSnapshot(gameSession, targetCursor);

    const view: GameView = {
        gameId: gameSession.id,
        rows: gameSession.rows,
        cols: gameSession.cols,
        mines: gameSession.mines,
        status: gameSession.status,
        lives: {left: gameSession.livesLeft, total: gameSession.livesTotal},
        quickFlag: gameSession.quickFlag,
        cursor: targetCursor,
        totalActions: gameSession.actions.length,
        elapsedTime: 0,
        board: {
            opened: s.opened,
            flagged: s.flagged,
            permanentFlags: s.permanentFlags || [],
            lostOn: s.lostOn,
            cleared: s.cleared,
            mines: (s.lostOn || s.cleared)
                   ? gameSession.minePositions.map(([row, col]) => ({row, col}))
                   : undefined
        },
        isPreview: true,
        previewIndex: targetCursor
    };

    logEnd("preview", start, {gameId: id, previewCursor: targetCursor});
    return view;
}

export function preview(id: string, toIndex: number): GameView {
    return seek(id, toIndex, true);
}

export function revive(id: string, toIndex?: number): GameView {
    const start = logStart("revive", {gameId: id, toIndex});
    const gameSession = map.get(id);
    if(!gameSession) {
        console.error("[engine] revive - not found", {gameId: id});
        throw new Error("not found");
    }

    if(gameSession.livesTotal > 0 && gameSession.livesLeft <= 0) {
        console.warn("[engine] revive - no lives left", {gameId: id});
        throw new Error("no lives left");
    }

    // Find last mine explosion
    let lostIndex = -1;
    let lostCell: { row: number; col: number } | null = null;

    for(let iAction = gameSession.actions.length - 1; iAction >= 0; iAction--) {
        const action = gameSession.actions[iAction];
        if(action && action.type === "reveal") {
            const cell = getSolutionCell(gameSession, action.row, action.col);
            if(cell?.isMine) {
                lostIndex = iAction;
                lostCell = {row: action.row, col: action.col};
                break;
            }
        }
    }

    if(!lostCell) {
        console.warn("[engine] revive - no explosion found", {gameId: id});
        throw new Error("No explosion to revive from");
    }

    console.debug("[engine] revive - found explosion", {lostIndex, lostCell});

    // Determine target index (EXCLUSIVE - trim BEFORE this action)
    let targetIndex: number;
    if(toIndex !== undefined) {
        targetIndex = Math.min(Math.max(0, toIndex), lostIndex); // Clamp to lostIndex max
    }
    else {
        targetIndex = lostIndex; // go back to state BEFORE mine reveal
    }

    // Trim to state BEFORE target
    gameSession.actions = gameSession.actions.slice(0, targetIndex);

    // Add permanent flag
    const mineKey = `${lostCell.row},${lostCell.col}`;
    gameSession.permanentFlags.add(mineKey);
    console.debug("[engine] revive - added permanent flag", {mineKey});

    // Now add flag action AFTER trimming
    gameSession.actions.push({type: "flag", row: lostCell.row, col: lostCell.col, set: true});
    gameSession.cursor = gameSession.actions.length;

    // Resume timer
    if(gameSession.lastPauseStart) {
        gameSession.pausedDuration += Date.now() - gameSession.lastPauseStart;
        gameSession.lastPauseStart = undefined;
        console.debug("[engine] revive - timer resumed");
    }

    gameSession.status = "playing";

    const view = summarize(gameSession);
    logEnd("revive", start, {cursor: gameSession.cursor, livesLeft: gameSession.livesLeft});
    return {...view, status: "playing"};
}

export function hint(id: string) {
    const start = logStart("hint", {gameId: id});
    const gameSession = map.get(id);
    if(!gameSession) {
        console.error("[engine] hint - not found", {gameId: id});
        throw new Error("not found");
    }

    const snapshot = gameSession.lastSnapshot ?? stepToSnapshot(gameSession, gameSession.cursor);
    const openedSet = new Set(snapshot.opened.map((opened) => `${opened.row},${opened.col}`));
    const flaggedSet = new Set(snapshot.flagged.map((flagged) => `${flagged.row},${flagged.col}`));
    const hiddenMines = gameSession.minePositions.filter(([row, col]) => !openedSet.has(`${row},${col}`));

    console.debug("[engine] hint - hiddenMines count", {count: hiddenMines.length});

    if(hiddenMines.length === 0) {
        logEnd("hint", start, {result: "none"});
        return {type: "none"} as const;
    }

    // Find most useful mine: closest to opened cells and not flagged
    let bestMine: [number, number] | null = null;
    let bestScore = -1;

    for(const [mineRow, moneCol] of hiddenMines) {
        if(flaggedSet.has(`${mineRow},${moneCol}`)) {
            continue;
        } // Skip already flagged

        let adjacentOpenCount = 0;
        for(let deltaRow = -1; deltaRow <= 1; deltaRow++) {
            for(let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                if(deltaRow === 0 && deltaCol === 0) {
                    continue;
                }
                const resultRow = mineRow + deltaRow;
                const resultCol = moneCol + deltaCol;
                if(resultRow >= 0 && resultRow < gameSession.rows && resultCol >= 0 && resultCol < gameSession.cols) {
                    if(openedSet.has(`${resultRow},${resultCol}`)) {
                        adjacentOpenCount++;
                    }
                }
            }
        }

        // Score: more opened neighbors = more useful hint
        // Add position as tiebreaker for determinism
        const score = adjacentOpenCount * 10000 + mineRow * 100 + moneCol;
        if(score > bestScore) {
            bestScore = score;
            bestMine = [mineRow, moneCol];
        }
    }

    // If none near opened cells, take first unflagged (deterministic)
    if(!bestMine) {
        bestMine = hiddenMines.find(([row, col]) => !flaggedSet.has(`${row},${col}`)) ?? hiddenMines[0]!;
    }

    const [mineRow, mineCol] = bestMine;

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
    const rowStart = clamp(mineRow - 1, 0, gameSession.rows - 1);
    const rowEnd = clamp(mineRow + 1, 0, gameSession.rows - 1);
    const colStart = clamp(mineCol - 1, 0, gameSession.cols - 1);
    const colEnd = clamp(mineCol + 1, 0, gameSession.cols - 1);

    const hintRectangle = {rowStart, colStart, rowEnd, colEnd};
    logEnd("hint", start, {selectedMine: [mineRow, mineCol], hintRectangle, score: bestScore});
    return {type: "mine-area", hintRectangle} as const;
}

export function pauseGameSession(id: string, timerSec: number): GameView {
    const start = logStart("pauseGameSession", {gameId: id});

    const gameSession = map.get(id);
    if(!gameSession) {
        console.error("[engine] pauseGameSession - not found", {gameId: id});
        throw new Error("not found");
    }

    // If the game hasn't started yet, do nothing
    if(!gameSession.startTime) {
        console.debug("[engine] pauseGameSession - no startTime, skip", {gameId: id});
        const view = summarize(gameSession);
        logEnd("pauseGameSession", start, {gameId: id, result: "no-start"});
        return view;
    }

    // If already paused, do nothing
    if(gameSession.lastPauseStart) {
        console.debug("[engine] pauseGameSession - already paused", {gameId: id, lastPauseStart: gameSession.lastPauseStart});
        const view = summarize(gameSession);
        logEnd("pauseGameSession", start, {gameId: id, result: "already-paused"});
        return view;
    }

    const now = Date.now();
    gameSession.pausedDuration = Math.max(0, (now - gameSession.startTime) - Math.round(timerSec * 1000));
    gameSession.lastPauseStart = now;

    console.debug("[engine] pauseGameSession - paused", {gameId: id, lastPauseStart: gameSession.lastPauseStart, pausedDuration: gameSession.pausedDuration});

    const view = summarize(gameSession);
    logEnd("pauseGameSession", start, {gameId: id, paused: true});
    return view;
}

export function resumeGameSession(id: string): GameView {
    const start = logStart("resumeGameSession", {gameId: id});

    const gameSession = map.get(id);
    if(!gameSession) {
        console.error("[engine] resumeGameSession - not found", {gameId: id});
        throw new Error("not found");
    }

    // If the game hasn't started yet, do nothing
    if(!gameSession.startTime) {
        console.debug("[engine] resumeGameSession - no startTime, skip", {gameId: id});
        const view = summarize(gameSession);
        logEnd("resumeGameSession", start, {gameId: id, result: "no-start"});
        return view;
    }

    // If not currently paused, do nothing
    if(!gameSession.lastPauseStart) {
        console.debug("[engine] resumeGameSession - not paused", {gameId: id});
        const view = summarize(gameSession);
        logEnd("resumeGameSession", start, {gameId: id, result: "not-paused"});
        return view;
    }

    const now = Date.now();
    const pausedInterval = now - gameSession.lastPauseStart;
    gameSession.pausedDuration = (gameSession.pausedDuration || 0) + pausedInterval;

    // Clear pause marker
    delete gameSession.lastPauseStart;

    console.debug("[engine] resumeGameSession - resumed", {gameId: id, pausedIntervalMs: pausedInterval, pausedDurationMs: gameSession.pausedDuration});

    const view = summarize(gameSession);
    logEnd("resumeGameSession", start, {gameId: id, resumed: true, pausedIntervalMs: pausedInterval});
    return view;
}

function pickPlacement(pool: Array<[number, number]>, needMines: number, rows: number,
                       cols: number, clickRow: number, clickCol: number, maxZeroRegion: number,
                       attemptsCount: number): Array<[number, number]> | null {
    for(let iAttempt = 0; iAttempt < attemptsCount; iAttempt++) {
        const copy = fisherYatesShuffle(pool);
        const candidate = copy.slice(0, needMines);
        const grid = computeSolutionGrid(rows, cols, candidate);

        try {
            const opened = new Set<string>();
            const openedCells = floodFillOpen(grid, clickRow, clickCol, opened);
            if(openedCells.length <= maxZeroRegion) {
                return candidate;
            }
        }
        catch {
            // ignore and retry
        }
    }

    return null;
}

function applyPlacement(gameSession: GameSession, positions: Array<[number, number]>,
                        clickRow: number, clickCol: number, warnPrefix = ""): void {
    gameSession.minePositions = positions;
    gameSession.solutionGrid = computeSolutionGrid(gameSession.rows, gameSession.cols, positions);

    const clickedCell = getSolutionCell(gameSession, clickRow, clickCol);
    if(!clickedCell || clickedCell.adjacentMines !== 0) {
        console.warn("[engine] ensureFirstClickSafe - clicked cell has adjacent mines", {
            note: warnPrefix || undefined,
            clickRow,
            clickCol,
            adjacent: clickedCell?.adjacentMines
        });
    }
}
