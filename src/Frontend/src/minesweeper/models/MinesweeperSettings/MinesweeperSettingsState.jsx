export function deriveInitialStateFromCaps(caps) {
    const secondPreset = (caps?.presets || [])[1];
    return {
        preset: secondPreset?.name || "Medium",
        rows: secondPreset?.rows ?? 16,
        cols: secondPreset?.cols ?? 16,
        mines: secondPreset?.mines ?? 40,
        lives: secondPreset?.lives ?? 3,
        features: caps?.features || {timer: true, undo: true, hints: true},
        limits: caps?.limits ?? 225,
        presets: caps?.presets || []
    };
}
