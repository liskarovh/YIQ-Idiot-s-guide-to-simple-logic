import {MinesweeperApiController} from "../../controllers/MinesweeperApiController";
import {LAST_CREATE_PAYLOAD_KEY, LAST_GAMEPLAY_PREFS_KEY} from "../MinesweeperStorageKeys";

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

export function persistLastGameplayPrefs(gameplayPrefs) {
    localStorage.setItem(LAST_GAMEPLAY_PREFS_KEY, JSON.stringify(gameplayPrefs));
}

export function persistLastCreatePayload(createPayload) {
    localStorage.setItem(LAST_CREATE_PAYLOAD_KEY, JSON.stringify(createPayload));
}
