/** @packageDocumentation
 * Core game engine for the Minesweeper backend.
 * Manages game sessions, applies player actions, runs the timer, and implements
 * undo/seek/replay and revive features.
 */

import {randomUUID} from "crypto";
import {createMinePositions, maskForClient} from "./util";
import type {GameOptions, GameSession, GameView, Snapshot} from "./types";
import Minefield from "mineswift";

/** In-memory store of active game sessions.
 * Key = game UUID, Value = full {@link GameSession}.
 * @remarks
 * Volatile storage — data are lost on server restart. Replace with a persistent store
 * (e.g., Redis/DB) for production deployments.
 */
const mem = new Map<string, GameSession>();

/** Builds a `Minefield` instance from a session's mine layout.
 * @param g Game session containing predefined mine positions.
 * @returns A Mineswift `Minefield` instance ready for simulation.
 * @remarks
 * Library capabilities:
 * - Simulates Minesweeper logic (reveal, flag, win/lose).
 * - Accepts explicit mine positions (no random generation required).
 * - `randomize()` can reshuffle mines (used for no-guess).
 * - `moveMineToCorner()` protects the very first click in non no-guess mode.
 */
function buildField(g: GameSession): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (Minefield as any)(g.rows, g.cols, {mines: g.minePositions});
}

/** Replays action history up to the `upto` index and produces a board snapshot.
 * This is the core of the undo/seek/replay mechanics.
 * @param g Game session with an action history.
 * @param upto Replays actions in the half-open range `[0, upto)`.
 * @returns Snapshot of the board state after replay.
 * @remarks
 * Process:
 * 1. Construct a fresh `Minefield` with original mine positions.
 * 2. Apply actions from index 0 to `upto - 1`.
 * 3. For the first reveal, enforce no-guess (if enabled) or first-click safety.
 * 4. Track loss (`lostOn`) and win (`cleared`) conditions.
 * 5. Serialize visible state into `opened/flagged` lists.
 *
 * No-guess notes:
 * - The first click must be logically solvable (no guessing).
 * - `isSolvableFrom()` checks solvability; `randomize()` reshuffles until solvable.
 */
function stepToSnapshot(g: GameSession, upto: number): Snapshot {
    const mf = buildField(g);
    let cleared = false;
    let lostOn: { r: number; c: number } | undefined;

    // Replay history up to the selected index
    for(let i = 0; i < upto; i++) {
        const a = g.actions[i];

        if(!a) {
            continue;
        }

        if(a.type === "flag") {
            // Place/remove/toggle a flag
            const cell = mf.cellAt([a.row, a.column]);

            // set=true -> set; set=false -> clear; undefined -> toggle
            cell.isFlag = a.set !== undefined ? a.set : !cell.isFlag;
        }
        else if(a.type === "reveal") {
            // Reveal a cell

            // First click handling
            if(g.firstClickNoGuess && i === 0) {
                // Ensure a logically solvable position from the first click
                while(!mf.isSolvableFrom([a.row, a.column])) {
                    mf.randomize();
                }
            }
            else if(i === 0) {
                // Non no-guess mode: ensure first click isn't an immediate mine
                const cell = mf.cellAt([a.row, a.column]);
                if(cell.isMine) {
                    mf.moveMineToCorner();
                }
            }

            // Execute reveal
            mf.open([a.row, a.column]);

            // Loss check
            if(mf.isLost()) {
                lostOn = {r: a.row, c: a.column};
            }

            // Win check
            if(mf.isCleared()) {
                cleared = true;
            }
        }
    }

    // Serialize visible state
    const opened: Snapshot["opened"] = [];
    const flagged: Snapshot["flagged"] = [];

    for(let r = 0; r < mf.rows; r++) {
        for(let c = 0; c < mf.cols; c++) {
            const cell = mf.cellAt([r, c]);

            if(cell.isOpen) {
                opened.push({r, c, adj: cell.mines});
            }
            if(cell.isFlag) {
                flagged.push({r, c});
            }
        }
    }

    return {opened, flagged, lostOn, cleared};
}

/** Updates the game status from a fresh snapshot and returns a client view.
 * Invoked after every action or when querying game state.
 * @param g Game session to evaluate.
 * @returns {@link GameView} for the client.
 * @remarks
 * Status rules:
 * - `won`: all safe cells revealed.
 * - `lost`: stepped on a mine and no lives left.
 * - `playing`: otherwise (including mined cell with lives remaining).
 * - `new`: no actions yet (`cursor === 0`).
 */
function summarize(g: GameSession): GameView {
    // Generate current snapshot (from start to cursor)
    const s = stepToSnapshot(g, g.cursor);
    g.lastSnapshot = s;

    // Update status from snapshot
    if(s.cleared) {
        g.status = "won";
    }
    else if(s.lostOn) {
        g.status = g.livesLeft > 0 ? "playing" : "lost";
    }
    else {
        g.status = g.cursor === 0 ? "new" : "playing";
    }

    // Produce client-safe view
    return maskForClient(g, s);
}

/** Creates a new game session.
 * @param payload Game configuration (dimensions, mines, feature toggles).
 * @returns Initial {@link GameView} for the newly created game.
 * @throws Error If required fields (`rows`, `cols`, `mines`) are missing.
 * @remarks
 * Flow:
 * 1. Validate presence of `rows/cols/mines`.
 * 2. Generate a game UUID.
 * 3. Create mine positions.
 * 4. Initialize {@link GameSession}.
 * 5. Persist to memory and return the initial view.
 *
 * Timer initialization:
 * - `startTime`: `undefined` (begins on first move)
 * - `pausedDuration`: `0`
 * - `lastPauseStart`: `undefined`
 */
export function createGame(payload: Partial<GameOptions>): GameView {
    if(!payload.rows || !payload.cols || payload.mines == null) {
        throw new Error("Missing rows/cols/mines");
    }
    if(payload.rows <= 0 || payload.cols <= 0) {
        throw new Error("rows/cols must be positive");
    }
    if(payload.mines < 0 || payload.mines >= payload.rows * payload.cols) {
        throw new Error("invalid mines count");
    }

    const id = randomUUID();
    const g: GameSession = {
        id,
        rows: payload.rows,
        cols: payload.cols,
        mines: payload.mines,
        minePositions: createMinePositions(payload.rows, payload.cols, payload.mines),
        firstClickNoGuess: !!payload.firstClickNoGuess,
        // 0 = unlimited lives
        livesTotal: Math.max(0, payload.lives ?? 0),
        livesLeft: Math.max(0, payload.lives ?? 0),
        quickFlag: !!payload.quickFlag,
        status: "new",
        actions: [],
        cursor: 0,
        // Timer prepared but not started
        pausedDuration: 0
    };

    mem.set(id, g);
    return summarize(g);
}

/** Retrieves the current state of an existing game.
 * @param id Game UUID.
 * @returns Current {@link GameView}.
 * @throws Error If the game does not exist (`"not found"`).
 */
export function getGame(id: string): GameView {
    const g = mem.get(id);
    if(!g) {
        throw new Error("not found");
    }
    return summarize(g);
}

/** Reveals a cell at `[r, c]`.
 * Appends a `reveal` action to history and advances the cursor.
 * @param id Game UUID.
 * @param r Row index (0-based).
 * @param c Column index (0-based).
 * @returns {@link GameView} after applying the action.
 * @throws Error If the game does not exist (`"not found"`).
 * @throws Error If the game is over (`"game over"`) with no lives left.
 * @remarks
 * Timer logic:
 * - First move: set `startTime = now`.
 * - Resume from pause: add to `pausedDuration`, clear `lastPauseStart`.
 *
 * Undo logic:
 * - If cursor is not at the end, truncate `actions` (drop the “future”).
 *
 * Lives:
 * - If a mine is hit and lives remain, keep `status = "playing"`.
 * - Lives are not consumed automatically here; use {@link revive}.
 * - `status` becomes `"lost"` only when no lives remain.
 */
export function reveal(id: string, r: number, c: number): GameView {
    const g = mem.get(id);
    if(!g) {
        throw new Error("not found");
    }
    if(g.status === "lost" && g.livesLeft === 0) {
        throw new Error("game over");
    }

    // Resume timer if paused (undo/seek)
    if(g.lastPauseStart) {
        g.pausedDuration += Date.now() - g.lastPauseStart;
        g.lastPauseStart = undefined;
    }

    // Start timer on first move
    if(!g.startTime && g.cursor === 0) {
        g.startTime = Date.now();
    }

    // Truncate history if we're mid-timeline
    g.actions = g.actions.slice(0, g.cursor);

    // Add reveal action
    g.actions.push({type: "reveal", row: r, column: c});
    g.cursor++;

    const view = summarize(g);

    // If a mine was hit but lives remain, keep playing
    if(view.status === "lost" && g.livesLeft > 0) {
        g.status = "playing";
    }

    return view;
}

/** Places or removes a flag at `[r, c]`.
 * @param id Game UUID.
 * @param r Row index (0-based).
 * @param c Column index (0-based).
 * @param set `true` = set, `false` = clear, `undefined` = toggle.
 * @returns {@link GameView} after applying the action.
 * @throws Error If the game does not exist (`"not found"`).
 * @remarks
 * Timer:
 * - Same behavior as {@link reveal}; the first-ever flag can start the timer.
 *
 * Quick-flag mode:
 * - This endpoint always receives explicit `flag` requests.
 * - UI “quick flag” only alters client click behavior; engine logic is unchanged.
 */
export function flag(id: string, r: number, c: number, set?: boolean): GameView {
    const g = mem.get(id);
    if(!g) {
        throw new Error("not found");
    }

    // Resume timer if paused
    if(g.lastPauseStart) {
        g.pausedDuration += Date.now() - g.lastPauseStart;
        g.lastPauseStart = undefined;
    }

    // Start timer on first action (even if it's a flag)
    if(!g.startTime && g.cursor === 0) {
        g.startTime = Date.now();
    }

    // Truncate history if we're mid-timeline
    g.actions = g.actions.slice(0, g.cursor);

    // Add flag action
    g.actions.push({type: "flag", row: r, column: c, set});
    g.cursor++;

    return summarize(g);
}

/** Enables or disables quick-flag mode (UI preference).
 * @param id Game UUID.
 * @param quickFlag `true` to make primary click place flags; `false` to reveal.
 * @returns Confirmation payload with the effective flag.
 * @throws Error If the game does not exist (`"not found"`).
 * @remarks
 * This is a UI-only preference and can change at any time; it does not alter engine rules.
 */
export function setMode(id: string, quickFlag: boolean) {
    const g = mem.get(id);
    if(!g) {
        throw new Error("not found");
    }
    g.quickFlag = quickFlag;
    return {ok: true, quickFlag: g.quickFlag};
}

/** Steps the cursor backward by `steps` (default `1`).
 * Starts timing pause while seeking backward; clears pause if seeking to start.
 * @param id Game UUID.
 * @param steps Number of steps to move back (min `1`).
 * @returns {@link GameView} after the seek.
 * @throws Error If the game does not exist (`"not found"`).
 */
export function undo(id: string, steps = 1): GameView {
    const g = mem.get(id);
    if(!g) {
        throw new Error("not found");
    }

    // Start pause when seeking backwards
    if(!g.lastPauseStart && g.cursor > 0) {
        g.lastPauseStart = Date.now();
    }

    g.cursor = Math.max(0, g.cursor - Math.max(1, steps));

    // If we reached the start, finalize and clear the pause
    if(g.cursor === 0 && g.lastPauseStart) {
        g.pausedDuration += Date.now() - g.lastPauseStart;
        g.lastPauseStart = undefined;
    }

    return summarize(g);
}

/** Moves the cursor to an absolute action index.
 * Starts pause when entering the past; resumes when seeking to the end or start.
 * @param id Game UUID.
 * @param toIndex Target action index (clamped to `[0, actions.length]`).
 * @returns {@link GameView} after the seek.
 * @throws Error If the game does not exist (`"not found"`).
 */
export function seek(id: string, toIndex: number): GameView {
    const g = mem.get(id);
    if(!g) {
        throw new Error("not found");
    }

    const newCursor = Math.min(Math.max(0, toIndex), g.actions.length);

    // Start pause when entering the past
    if(!g.lastPauseStart && g.cursor !== newCursor && newCursor < g.actions.length) {
        g.lastPauseStart = Date.now();
    }

    // Resume when seeking to the end
    if(newCursor === g.actions.length && g.lastPauseStart) {
        g.pausedDuration += Date.now() - g.lastPauseStart;
        g.lastPauseStart = undefined;
    }

    // Also resume if seeking to the very start
    if(newCursor === 0 && g.lastPauseStart) {
        g.pausedDuration += Date.now() - g.lastPauseStart;
        g.lastPauseStart = undefined;
    }

    g.cursor = newCursor;
    return summarize(g);
}

/** Consumes one life and rewinds (optionally) before resuming play.
 * @param id Game UUID.
 * @param toIndex Optional index to seek to before resuming (defaults to current cursor).
 * @returns {@link GameView} after revival (forced `status = "playing"`).
 * @throws Error If the game does not exist (`"not found"`).
 * @throws Error If no lives remain (`"no lives left"`).
 */
export function revive(id: string, toIndex?: number): GameView {
    const g = mem.get(id);
    if(!g) {
        throw new Error("not found");
    }
    if(g.livesLeft <= 0) {
        throw new Error("no lives left");
    }

    // Use one life
    g.livesLeft--;

    // Seek to the requested index (or keep current cursor)
    const targetIndex = toIndex !== undefined ? toIndex : g.cursor;
    g.cursor = Math.min(Math.max(0, targetIndex), g.actions.length);

    // Resume timer after revive
    if(g.lastPauseStart) {
        g.pausedDuration += Date.now() - g.lastPauseStart;
        g.lastPauseStart = undefined;
    }

    // Force status back to playing
    const view = summarize(g);
    g.status = "playing";

    return {...view, status: "playing"};
}

/**
 * Returns a coarse hint by revealing a rectangle around a hidden mine.
 *
 * @param id Game UUID.
 * @returns A hint descriptor: either `{ type: "none" }` or `{ type: "mine-area", rect: { r0, c0, r1, c1 } }`.
 * @throws Error If the game does not exist (`"not found"`).
 *
 * @remarks The hint does not leak exact positions; it suggests a neighborhood to inspect.
 */
export function hint(id: string) {
    const g = mem.get(id);
    if(!g) {
        throw new Error("not found");
    }

    const s = g.lastSnapshot ?? stepToSnapshot(g, g.cursor);

    const openedSet = new Set(s.opened.map((o) => `${o.r},${o.c}`));
    const hiddenMines = g.minePositions.filter(([r, c]) => !openedSet.has(`${r},${c}`));

    if(hiddenMines.length === 0) {
        return {type: "none"} as const;
    }

    const idx = Math.floor(Math.random() * hiddenMines.length);
    const [mr, mc] = hiddenMines[idx]!;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const r0 = clamp(mr - 1, 0, g.rows - 1);
    const r1 = clamp(mr + 1, 0, g.rows - 1);
    const c0 = clamp(mc - 1, 0, g.cols - 1);
    const c1 = clamp(mc + 1, 0, g.cols - 1);
    return {type: "mine-area", rect: {r0, c0, r1, c1}} as const;
}
