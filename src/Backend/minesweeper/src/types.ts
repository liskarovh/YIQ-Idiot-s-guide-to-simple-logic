/** @packageDocumentation
 * Typed contracts for a Minesweeper backend.
 * Defines presets, lifecycle status, game options, creation payloads, player actions,
 * immutable board snapshots, the server-only game session, and the client-facing view model.
 *
 * @remarks
 * Keep {@link GameSession} internal and never serialize it directly; convert to {@link GameView}.
 */

/** Predefined game difficulties.
 * - `Easy`: 9x9, 10 mines
 * - `Medium`: 16x16, 40 mines
 * - `Hard`: 16x30, 99 mines (expert)
 */
export type Preset = "Easy" | "Medium" | "Hard";

/** Game lifecycle status.
 * - `new`: game was created; no moves yet
 * - `playing`: game in progress
 * - `lost`: player stepped on a mine (no lives left)
 * - `won`: all safe cells revealed
 */
export type Status = "new" | "playing" | "lost" | "won";

/** Player actions recorded into history (for undo/replay). */
export type Action =
/** Reveal a single cell at coordinates `[r,c]`. */
    | { type: "reveal"; row: number; column: number }

    /** Place/remove/toggle a flag at `[r,c]`.
     * If `set` is:
     * - `true`  -> ensure flagged
     * - `false` -> ensure unflagged
     * - `undefined` -> toggle
     */
    | { type: "flag"; row: number; column: number; set?: boolean };

export interface ComputedCell {
    isMine: boolean;
    adjacentMines: number; // 0-8
}

/** Complete game configuration.
 * Defines board dimensions, mine count, and feature toggles.
 */
export interface GameOptions {
    /** Number of board rows. */
    rows: number;

    /** Number of board columns. */
    cols: number;

    /** Total number of mines on the board. */
    mines: number;

    /** Guarantees a solvable first click (no-guess mode). */
    firstClickNoGuess?: boolean;

    /** Number of lives; `0` means unlimited. */
    lives?: number;

    /** Quick-flag mode: primary click places flags instead of revealing. */
    quickFlag?: boolean;
}

/** Payload for creating a game from a predefined {@link Preset}.
 * Allows selectively overriding preset defaults.
 */
export interface CreatePayloadPreset {
    /** Selected difficulty preset. */
    preset: Preset;

    /** Override: no-guess first click.
     * @defaultValue preset-specific
     */
    firstClickNoGuess?: boolean;

    /** Override: number of lives (0 = unlimited).
     * @defaultValue preset-specific
     */
    lives?: number;

    /** Override: quick-flag mode.
     * @defaultValue preset-specific
     */
    quickFlag?: boolean;
}

/** Payload for creating a custom game with explicit dimensions.
 * Partially extends {@link GameOptions} but requires the core shape.
 */
export interface CreatePayloadCustom extends Partial<GameOptions> {
    /** Required: number of rows. */
    rows: number;

    /** Required: number of columns. */
    cols: number;

    /** Required: total mines. */
    mines: number;
}

/** Immutable, client-safe snapshot of the visible board state.
 * Used to render the board without exposing mine positions.
 */
export interface Snapshot {
    /** Opened cells with adjacent mine counts. */
    opened: Array<{ r: number; c: number; adj: number }>;

    /** Flagged cells. */
    flagged: Array<{ r: number; c: number }>;

    /** Cell that triggered a loss (if any). */
    lostOn?: { r: number; c: number };

    /** True if all safe cells have been revealed (win). */
    cleared?: boolean;
}

/** Server-side representation of a game session (contains secrets).
 * Never send to clients directly—use a mapper (e.g., `maskForClient`) to produce {@link GameView}.
 * @internal
 */
export interface GameSession {
    /** Unique game identifier (UUID). */
    id: string;

    /** Number of board rows. */
    rows: number;

    /** Number of board columns. */
    cols: number;

    /** Total number of mines. */
    mines: number;

    /** SECRET: all mine positions as `[row, col]` pairs. */
    minePositions: Array<[number, number]>;

    /** precomputed grid with all cell properties */
    solutionGrid: ComputedCell[][];

    /** Lives at start. */
    livesTotal: number;

    /** Lives remaining. */
    livesLeft: number;

    /** Quick-flag mode enabled? */
    quickFlag: boolean;

    /** Current lifecycle status. */
    status: Status;

    /** Full action history. */
    actions: Action[];

    /** Current history cursor (for undo/replay). */
    cursor: number;

    /** Cached last generated snapshot. */
    lastSnapshot?: Snapshot;

    /** Timestamp (ms) of the first move; timers start here. */
    startTime?: number;

    /** Accumulated paused time in ms (e.g., during undo/seek). */
    pausedDuration: number;

    /** Timestamp (ms) when the current pause started; `undefined` means running. */
    lastPauseStart?: number;
}

/** Client-facing view model (safe to serialize).
 * Contains everything needed to render UI and display progress.
 */
export interface GameView {
    /** ID used by client API calls. */
    gameId: string;

    /** Number of board rows. */
    rows: number;

    /** Number of board columns. */
    cols: number;

    /** Total mines (for the counter). */
    mines: number;

    /** Current lifecycle status. */
    status: Status;

    /** Lives information. */
    lives: { left: number; total: number };

    /** Quick-flag mode enabled? */
    quickFlag: boolean;

    /** Current position in history (0…`totalActions`). */
    cursor: number;

    /** Total actions in history (replay length). */
    totalActions: number;

    /** Effective in-game time in seconds (excludes paused time). */
    elapsedTime: number;

    /** Visible board layers. */
    board: {
        /** Opened cells with adjacent mine counts. */
        opened: Array<{ r: number; c: number; adj: number }>;

        /** Flagged cells. */
        flagged: Array<{ r: number; c: number }>;

        /** Cell that caused a loss (if any) */
        lostOn?: { r: number; c: number };

        /** True if all safe cells have been revealed (win). */
        cleared?: boolean;

        /** Revealed mine positions (only present when safe to reveal, e.g. after loss/win) */
        mines?: Array<{ r: number; c: number }>;
    };
}
