export function buildCreatePayload({preset, rows, cols, mines, lives}) {
    if(preset && preset !== "Custom") {
        return {preset, lives};
    }
    return {rows, cols, mines, lives};
}

export function buildUiPrefs({showTimer, allowUndo, enableHints}) {
    return {showTimer, allowUndo, enableHints};
}
