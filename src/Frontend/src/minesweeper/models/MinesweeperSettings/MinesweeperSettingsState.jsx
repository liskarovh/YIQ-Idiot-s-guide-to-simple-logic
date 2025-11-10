export function deriveInitialStateFromCaps(caps) {
    const secondPreset = (caps?.presets || [])[1];
    const defaults = {
        preset: secondPreset?.name || "Medium",
        rows: secondPreset?.rows ?? 16,
        cols: secondPreset?.cols ?? 16,
        mines: secondPreset?.mines ?? 40,
        lives: 3,
        features: caps?.features || {undo: true, hints: true, replay: true},
        limits: caps?.limits ?? 225,
        presets: caps?.presets || []
    };
    return defaults;
}
