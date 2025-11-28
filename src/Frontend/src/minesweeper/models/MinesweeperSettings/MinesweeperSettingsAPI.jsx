import {MinesweeperApiController} from "../../controllers/MinesweeperApiController";

const ctrl = MinesweeperApiController();

export const isAbortLikeError = ctrl.isAbortLikeError;

export async function getCapabilities({signal} = {}) {
    return ctrl.getJson("capabilities", {signal});
}

export async function getMaxMines(rows, cols, {signal} = {}) {
    return ctrl.postJson("max-mines", {rows, cols}, {signal});
}

export async function getDetectPreset(rows, cols, mines, {signal} = {}) {
    return ctrl.postJson("preset", {rows, cols, mines}, {signal});
}

export async function postCreateGame(createPayload, {signal} = {}) {
    return ctrl.postJson("game", createPayload, {signal});
}

export function persistGameplayPrefs(gameId, uiPrefs) {
    localStorage.setItem(`ms:uiPrefs:${gameId}`, JSON.stringify(uiPrefs));
}

export function persistLastCreate(createPayload) {
    localStorage.setItem("ms:lastCreate", JSON.stringify(createPayload));
}
