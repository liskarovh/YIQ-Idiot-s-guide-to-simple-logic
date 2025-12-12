import {MinesweeperApiController} from "../../controllers/MinesweeperApiController";

const ctrl = MinesweeperApiController();

export const isAbortLikeError = ctrl.isAbortLikeError;

export async function getCapabilities({signal} = {}) {
    return ctrl.getJson("capabilities", {signal});
}

export async function getMaxMines(rows, cols, {signal} = {}) {
    return ctrl.getJson("max-mines", {params: {rows, cols}, signal});
}

export async function getDetectPreset(rows, cols, mines, {signal} = {}) {
    return ctrl.getJson("preset", {params: {rows, cols, mines}, signal});
}

export async function postCreateGame(createPayload, {signal} = {}) {
    return ctrl.postJson("game", createPayload, {signal});
}

export function persistGameplayPrefs(gameId, uiPrefs) {
    localStorage.setItem(`minesweeper:gameplayPrefs:${gameId}`, JSON.stringify(uiPrefs));
}

export function persistLastCreatePayload(createPayload) {
    localStorage.setItem("minesweeper:lastCreatePayload", JSON.stringify(createPayload));
}
