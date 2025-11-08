export function detectPreset(r, c, m, presets = {}) {
    console.log("[SettingsView] detectPreset called with:", {rows: r, cols: c, mines: m});

    for(const [presetName, config] of Object.entries(presets)) {
        if(config.rows === r && config.cols === c && config.mines === m) {
            console.log("[SettingsView] detectPreset found match:", presetName);
            return presetName;
        }
    }

    console.log("[SettingsView] detectPreset no match, using Custom");
    return "Custom";
}

export function calcMaxMines(rows, cols) {
    return Math.max(1, (rows - 1) * (cols - 1));
}

export function clampMines(mines, maxMines) {
    return Math.min(maxMines, Math.max(1, mines));
}
