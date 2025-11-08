export function buildCreatePayload({preset, rows, cols, mines, lives}) {
    return preset === "Custom"
           ? {rows, cols, mines, lives, quickFlag: false, firstClickNoGuess: true}
           : {preset, lives, quickFlag: false, firstClickNoGuess: true};
}

export function buildUiPrefs({showTimer, allowUndo, enableHints}) {
    return {showTimer, captureReplay: true, allowUndo, enableHints, holdHighlight: true};
}
