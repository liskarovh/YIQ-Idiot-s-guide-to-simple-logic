export function buildCreatePayload({preset, rows, cols, mines, lives}) {
    if(preset && preset !== "Custom") {
        return {preset, lives};
    }
    return {rows, cols, mines, lives};
}

export function buildGameplayPrefs({showTimer, allowUndo, enableHints, captureReplay}) {
    return {showTimer, allowUndo, enableHints, captureReplay};
}
