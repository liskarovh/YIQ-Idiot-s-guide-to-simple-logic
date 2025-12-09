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
    /** Selected difficulty preset. */
    preset: Preset | "Custom";

    /** Number of board rows. */
    rows: number;

    /** Number of board columns. */
    cols: number;

    /** Total number of mines on the board. */
    mines: number;

    /** Number of lives; `0` means unlimited. */
    lives: number;
}


export interface CreatePayload extends Partial<GameOptions> {
    /** Selected difficulty preset. */
    preset: Preset | "Custom";

    /** Required: number of rows. */
    rows: number;

    /** Required: number of columns. */
    cols: number;

    /** Required: total mines. */
    mines: number;

    /** Number of lives; `0` means unlimited. */
    lives: number;
}

/** Immutable, client-safe snapshot of the visible board state.
 * Used to render the board without exposing mine positions.
 */
export interface Snapshot {
    /** Opened cells with adjacent mine counts. */
    opened: Array<{
        r: number;
        c: number;
        adj: number
    }>;

    /** Flagged cells. */
    flagged: Array<{
        r: number;
        c: number
    }>;

    permanentFlags?: Array<{
        r: number;
        c: number
    }>;

    /** Cell that triggered a loss (if any). */
    lostOn?: {
        r: number;
        c: number
    };

    /** True if all safe cells have been revealed (win). */
    cleared?: boolean;

    /** Number of lives consumed up to this snapshot. */
    livesConsumed?: number;
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

    permanentFlags: Set<string>;

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
    lives: {
        left: number;
        total: number
    };

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
        opened: Array<{
            r: number;
            c: number;
            adj: number
        }>;

        /** Flagged cells. */
        flagged: Array<{
            r: number;
            c: number
        }>;

        permanentFlags?: Array<{
            r: number;
            c: number
        }>;

        /** Cell that caused a loss (if any) */
        lostOn?: {
            r: number;
            c: number
        };

        /** True if all safe cells have been revealed (win). */
        cleared?: boolean;

        /** Revealed mine positions (only present when safe to reveal, e.g. after loss/win) */
        mines?: Array<{
            r: number;
            c: number
        }>;
    };

    /** True if this is a preview view (not actual game state). */
    isPreview?: boolean;

    /** Index being previewed (only when isPreview=true). */
    previewIndex?: number;
}

export type Limits = {
    rows: { min: number; max: number };
    cols: { min: number; max: number };
    mines: { min: number; max: number };
    lives: { min: number; max: number };
};

export type Features = {
    undo: boolean;
    hints: boolean;
    replay: boolean;
};

export type CapabilitiesResponse = {
    presets: Array<{
        name: Preset;
        rows: number;
        cols: number;
        mines: number
    }>;
    limits: Limits;
    features: Features;
};

export type IdempotencyValue = {
    status: number;
    location: string;
    body: any;
    expiresAt: number
};

export interface UnifiedError {
    status: number;
    payload: {
        code: string;
        message: string;
        details: any | null;
    };
}
