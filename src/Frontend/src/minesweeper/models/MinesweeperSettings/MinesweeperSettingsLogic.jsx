export function maxMinesForGrid(rows, cols) {
    return Math.max(1, (rows - 1) * (cols - 1));
}

export function detectPreset(rows, columns, mines, presets) {
    if(!presets) {
        return "Custom";
    }

    const rowsCount = Number(rows);
    const colsCount = Number(columns);
    const minesCount = Number(mines);

    if(!Number.isFinite(rowsCount) || !Number.isFinite(colsCount) || !Number.isFinite(minesCount)) {
        return "Custom";
    }

    for(const preset of presets) {
        if(!preset) {
            continue;
        }

        const presetRows = Number(preset.rows);
        const presetCols = Number(preset.cols);
        const presetMines = Number(preset.mines);
        const presetName = preset.name;
        if(presetName && presetRows === rowsCount && presetCols === colsCount && presetMines === minesCount) {
            return presetName;
        }
    }

    return "Custom";
}

