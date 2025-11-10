import {getJson, postJson} from "../MinesweeperAPI";

export async function getCapabilities(base, {signal} = {}) {
    return getJson(base, "capabilities", {signal});
}

export async function createGame(base, payload, {signal, idempotencyKey} = {}) {
    return postJson(base, "game", payload, {signal, idempotencyKey});
}

export async function getMaxMines(base, payload, {signal, idempotencyKey} = {}) {
    return postJson(base, "max-mines", payload, {signal, idempotencyKey});
}

export async function detectPreset(base, payload, {signal, idempotencyKey} = {}) {
    return postJson(base, "preset", payload, {signal, idempotencyKey});
}

export function persistUiPrefs(gameId, uiPrefs) {
    localStorage.setItem(`ms:uiPrefs:${gameId}`, JSON.stringify(uiPrefs));
}

export function persistLastCreate(createPayload) {
    localStorage.setItem("ms:lastCreate", JSON.stringify(createPayload));
}
