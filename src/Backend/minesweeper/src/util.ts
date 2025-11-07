/** @packageDocumentation
 * Utility helpers for the Minesweeper backend.
 * Provides difficulty preset conversion, mine position generation, data masking for client output,
 * and real-time elapsed time calculation.
 */

import type {GameOptions, GameSession, Snapshot, Preset, GameView} from "./types";

/** Converts a difficulty preset into concrete board parameters.
 * @param p Difficulty preset (`Easy` | `Medium` | `Hard`).
 * @returns Object with `rows`, `cols`, and `mines` for the chosen preset.
 *
 * @remarks
 * Standard presets:
 * - **Easy:** 9x9 with 10 mines (≈ 11.1 % density)
 * - **Medium:** 16x16 with 40 mines (≈ 15.6 %)
 * - **Hard:** 16x30 with 99 mines (≈ 20.6 %) – classic Windows Expert
 */
export function presetToOpts(p: Preset): Pick<GameOptions, "rows" | "cols" | "mines"> {
    if(p === "Easy") {
        return {rows: 9, cols: 9, mines: 10};
    }
    if(p === "Medium") {
        return {rows: 16, cols: 16, mines: 40};
    }
    // Hard = Expert layout (wide format)
    return {rows: 16, cols: 30, mines: 99};
}

/** Calculates the total in-game elapsed time in seconds.
 * Measures time from the first move and subtracts all paused durations (undo/seek/exploded).
 * @param g Game session with timer data.
 * @returns Elapsed time in whole seconds.
 * @remarks
 * Logic:
 * - If the game hasn't started (`startTime === undefined`), returns `0`.
 * - `totalElapsed = now - startTime`
 * - `pausedTime = pausedDuration + currentPause` (if currently paused)
 * - `elapsed = totalElapsed - pausedTime`
 *
 * Timer is **paused** when:
 * - The player exploded and has lives remaining (reviewing history before revive)
 * - The player is viewing game over state
 * - Explicit pause is active
 *
 * Timer is **running** when:
 * - The player is actively playing (status === "playing" and no explosion)
 */
export function calculateElapsedTime(g: GameSession): number {
    if(!g.startTime) {
        return 0;
    }

    const now = Date.now();
    const totalElapsed = now - g.startTime;

    // Accumulated paused time
    let pausedTime = g.pausedDuration;

    // Include current pause if active
    if(g.lastPauseStart) {
        pausedTime += now - g.lastPauseStart;
    }

    // Return pure active gameplay time (seconds)
    return Math.max(0, Math.floor((totalElapsed - pausedTime) / 1000));
}

/** Produces a client-safe view of the game session.
 * Strips sensitive fields (mine positions) and adds derived metrics like elapsed time.
 * @param g Full server-side {@link GameSession} containing secrets.
 * @param s Visible board {@link Snapshot}.
 * @returns {@link GameView} safe to send to the client.
 * @remarks
 * - **Never** expose `minePositions` to the client during active gameplay.
 * - Mines are only revealed after game over (won/lost).
 * - The client receives only `opened` and `flagged` cells from the snapshot.
 * - `elapsedTime` is recomputed live for each request.
 */
export function maskForClient(g: GameSession, s: Snapshot): GameView {
    // Reveal all mine positions only when game is definitively over
    const revealMines = !!(s.lostOn || s.cleared);
    const mines = revealMines ? g.minePositions.map(([r, c]) => ({ r, c })) : undefined;

    return {
        gameId: g.id,
        rows: g.rows,
        cols: g.cols,
        mines: g.mines,
        status: g.status,
        lives: {left: g.livesLeft, total: g.livesTotal},
        quickFlag: g.quickFlag,
        cursor: g.cursor,
        totalActions: g.actions.length,
        elapsedTime: calculateElapsedTime(g),
        board: {
            opened: s.opened,
            flagged: s.flagged,
            permanentFlags: s.permanentFlags || [],
            lostOn: s.lostOn,
            cleared: s.cleared,
            mines
        }
    };
}

/** Generates random mine positions on the board using a Fisher–Yates shuffle.
 * @param rows Number of board rows.
 * @param cols Number of board columns.
 * @param mines Number of mines to place.
 * @returns Array of `[row, col]` pairs representing mine coordinates.
 * @remarks
 * Algorithm:
 * 1. Enumerate all possible cell positions.
 * 2. Shuffle them using Fisher–Yates (O(n)).
 * 3. Return the first `mines` positions.
 *
 * Note: The first click may modify these positions:
 * - In **no-guess mode**, mines are reshuffled to ensure first click is safe.
 */
export function createMinePositions(rows: number, cols: number, mines: number): Array<[number, number]> {
    // Input validation
    if(rows <= 0 || cols <= 0) {
        throw new Error("rows/cols must be positive");
    }
    const cells = rows * cols;
    if(mines < 0 || mines >= cells) {
        throw new Error("invalid mines count");
    }

    // Build a list of all cell coordinates
    const all: Array<[number, number]> = [];
    for(let r = 0; r < rows; r++) {
        for(let c = 0; c < cols; c++) {
            all.push([r, c]);
        }
    }

    // Fisher–Yates shuffle
    for(let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = all[i]!;
        all[i] = all[j]!;
        all[j] = tmp;
    }

    // Return the first N coordinates as mine positions
    return all.slice(0, mines);
}
