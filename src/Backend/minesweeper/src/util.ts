import type {CapabilitiesResponse, CreatePayload, GameOptions, GameSession, GameView, Limits, Preset, Snapshot} from "./types.js";
import {cPresets, cPresetParameters, cCapabilitiesLimits} from "./constants.js";

export function maskGameViewForClient(gameSession: GameSession, snapshot: Snapshot): GameView {
    // Determine whether we must reveal all mine coordinates (only when game is over)
    const revealMines = !!(snapshot.lostOn || snapshot.cleared);
    console.debug(`[UTILS.ts] maskGameViewForClient for game=${gameSession.id} revealMines=${revealMines}`);

    // When not revealing, keep mines undefined so the client cannot infer positions.
    const mines = revealMines ? gameSession.minePositions.map(([r, c]) => ({r, c})) : undefined;
    if (mines) {
        console.debug(`[UTILS.ts] maskGameViewForClient revealing ${mines.length} mines`);
    } else {
        console.debug(`[UTILS.ts] maskGameViewForClient not revealing mines`);
    }

    // Compose the public GameView object from fields that are safe / useful for the client.
    const result: GameView = {
        gameId: gameSession.id,
        rows: gameSession.rows,
        cols: gameSession.cols,
        mines: gameSession.mines,
        status: gameSession.status,
        lives: {left: gameSession.livesLeft, total: gameSession.livesTotal},
        quickFlag: gameSession.quickFlag,
        cursor: gameSession.cursor,
        totalActions: gameSession.actions.length,
        elapsedTime: calculateElapsedTime(gameSession),
        board: {
            opened: snapshot.opened,
            flagged: snapshot.flagged,
            permanentFlags: snapshot.permanentFlags || [],
            lostOn: snapshot.lostOn,
            cleared: snapshot.cleared,
            mines
        }
    }; // result: GameView

    console.debug(`[UTILS.ts] maskForClient result summary: opened=${snapshot.opened?.length ?? 0} flagged=${snapshot.flagged?.length ?? 0} cleared=${!!snapshot.cleared}`);
    return result;
} // maskForClient()

export function calculateElapsedTime(gameSession: GameSession): number {
    // If the session has not started, elapsed time is zero
    if(!gameSession.startTime) {
        console.debug(`[UTILS.ts] calculateElapsedTime - no startTime, returning 0`);
        return 0;
    }

    const now = Date.now();
    const totalElapsed = now - gameSession.startTime;

    // Accumulate previously recorded paused duration (may be undefined)
    let pausedTime = gameSession.pausedDuration || 0;

    // If currently paused, include the ongoing pause interval in pausedTime
    if(gameSession.lastPauseStart) {
        pausedTime += now - gameSession.lastPauseStart;
    }

    // Active play time = total elapsed time - paused time (converted to whole seconds and clamped to >= 0)
    const seconds = Math.max(0, Math.floor((totalElapsed - pausedTime) / 1000));
    console.debug(`[UTILS.ts] calculateElapsedTime computed: totalElapsed=${totalElapsed}ms pausedTime=${pausedTime}ms seconds=${seconds}`);

    return seconds;
} // calculateElapsedTime()

export function detectMapParametersFromPreset(preset: Preset): { rows: number; cols: number; mines: number } {
    console.debug(`[UTILS.ts] detectMapParametersFromPreset input:`, preset);

    // Convert the public Preset value (e.g. "Easy") to the lowercase key used in the preset maps (e.g. "easy")
    const key = (preset as string).toLowerCase() as keyof typeof cPresetParameters;

    // Try to read parameters from the central preset parameters map
    const params = cPresetParameters[key];
    if(params) {
        return params;  // Found exact mapping
    }

    // If preset not recognized fallback to the 'medium' preset
    console.warn(`[UTILS.ts] detectMapParametersFromPreset - unknown preset ${preset}, falling back to medium`);
    return cPresetParameters.medium;
} // detectMapParametersFromPreset()

export function detectPresetFromMapParameters(rows: number, cols: number, mines: number): Preset | "Custom" {
    console.debug(`[UTILS.ts] detectPresetFromMapParameters input: rows=${rows} cols=${cols} mines=${mines}`);

    // Iterate over the preset parameter entries looking for an exact match on rows/cols/mines
    for(const [key, params] of Object.entries(cPresetParameters) as [keyof typeof cPresetParameters, { rows: number; cols: number; mines: number }][]) {
        // If all three values match, return the corresponding Preset string from cPresets
        if(params.rows === rows && params.cols === cols && params.mines === mines) {
            const preset = cPresets[key];
            console.debug(`[UTILS.ts] detectPresetFromMapParameters matched preset:`, preset);
            return preset;
        }
    }

    // For no matching preset found return "Custom"
    console.debug(`[UTILS.ts] detectPresetFromMapParameters result: Custom`);
    return "Custom";
} // detectPresetFromMapParameters()

export function normalizeCreatePayload(createPayload: CreatePayload, limits: Limits): GameOptions {
    console.debug(`[UTILS.ts] normalizeCreatePayload input:`, createPayload);

    // Prepare variables for final normalized values
    let rows: number;
    let cols: number;
    let mines: number;
    let lives: number;

    // If a named preset is provided, use preset defaults
    if("preset" in createPayload && createPayload.preset) {
        const preset = createPayload.preset as Preset;
        const mapParameters = detectMapParametersFromPreset(preset);
        rows = mapParameters.rows;
        cols = mapParameters.cols;
        mines = mapParameters.mines;
        console.debug(`[UTILS.ts] normalizeCreatePayload used preset ${preset} ->`, {rows, cols, mines});
    }
    // Otherwise clamp custom values
    else {
        const customCreatePayload: any = createPayload;
        rows = clamp(Math.trunc(Number(customCreatePayload.rows) || 0), limits.rows.min, limits.rows.max);
        cols = clamp(Math.trunc(Number(customCreatePayload.cols) || 0), limits.cols.min, limits.cols.max);
        const customMaxMines = areaMaxMines(rows, cols);
        mines = clamp(Math.trunc(Number(customCreatePayload.mines) || 0), limits.mines.min, Math.min(limits.mines.max, customMaxMines));
        console.debug(`[UTILS.ts] normalizeCreatePayload custom clamped -> rows=${rows} cols=${cols} mines=${mines} (areaMaxMines=${customMaxMines})`);
    }

    // Lives (clamped)
    const livesRaw = Math.trunc(Number((createPayload as any).lives ?? 0));
    lives = clamp(livesRaw, limits.lives.min, limits.lives.max);

    // Final safety clamp for mines based on final area
    const calculatedMaxMines = areaMaxMines(rows, cols);
    mines = clamp(mines, limits.mines.min, Math.min(limits.mines.max, calculatedMaxMines));

    // Detect canonical preset for the final rows/cols/mines combination
    const detectedPreset = detectPresetFromMapParameters(rows, cols, mines);

    // Compose final GameOptions object
    const gameOptions: GameOptions = {
        preset: detectedPreset,
        rows,
        cols,
        mines,
        lives
    };

    console.debug(`[UTILS.ts] normalizeCreatePayload result:`, gameOptions);
    return gameOptions;
} // normalizeCreatePayload()

export function buildCapabilitiesPayload(): CapabilitiesResponse {
    // Build an array of preset (name + {rows, cols, mines}).
    const presets: { name: Preset; rows: number; cols: number; mines: number }[] = [
        { name: "Easy", ...detectMapParametersFromPreset("Easy") },
        { name: "Medium", ...detectMapParametersFromPreset("Medium") },
        { name: "Hard", ...detectMapParametersFromPreset("Hard") }
    ];

    // Declare feature flags supported by the server.
    const features = {
        timer: true,
        undo: true,
        hints: true,
        replay: true
    };

    // Compose final payload
    const payload = {
        presets,
        limits: cCapabilitiesLimits,
        lives: 3,
        features
    };

    console.debug(`[UTILS.ts] getCapabilitiesPayload:`, payload);
    return payload;
} // buildCapabilitiesPayload()

export function buildMaxMinesPayload(rows: number, cols: number): number {
    const maxMines = areaMaxMines(rows, cols);
    console.debug(`[UTILS.ts] buildMaxMinesPayload: maxMines=${maxMines}`);
    return maxMines;
} // buildMaxMinesPayload()

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
} // clamp()

function areaMaxMines(rows: number, cols: number) {
    return (rows - 1) * (cols - 1);
} // areaMaxMines()
