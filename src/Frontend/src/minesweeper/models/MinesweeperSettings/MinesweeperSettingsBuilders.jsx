export function buildCreatePayload({gameId, preset, rows, cols, mines, lives}) {
    if(preset && preset !== "Custom") {
        return {gameId, preset, lives};
    }
    return {gameId, rows, cols, mines, lives};
}

export function buildGameplayPrefs({gameId, showTimer, allowUndo, enableHints}) {
    return {gameId, showTimer, allowUndo, enableHints};
}
