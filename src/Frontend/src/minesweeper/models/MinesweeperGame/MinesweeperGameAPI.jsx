/**
 * @file MinesweeperGameAPI.jsx
 * @brief API functions for interacting with the Minesweeper game backend.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import {MinesweeperApiController} from "../../controllers/MinesweeperApiController";

const ctrl = MinesweeperApiController();

export const isAbortLikeError = ctrl.isAbortLikeError;

export async function getGame(id, {signal} = {}) {
    return ctrl.getJson(`game/${id}`, {signal});
}

export async function getHint(id, {signal} = {}) {
    return ctrl.getJson(`game/${id}/hint`, {signal});
}

export async function getResume(id, {signal} = {}) {
    return ctrl.getJson(`game/${id}/resume`, {signal});
}

export async function postPause(id, timerSec, {signal} = {}) {
    return ctrl.postJson(`game/${id}/pause`, {timerSec}, {signal});
}

export async function postReveal(id, row, col, {signal} = {}) {
    return ctrl.postJson(`game/${id}/reveal`, {row, col}, {signal});
}

export async function postFlag(id, row, col, set, {signal} = {}) {
    return ctrl.postJson(`game/${id}/flag`, {row, col, set}, {signal});
}

export async function postSetMode(id, quickFlag, {signal} = {}) {
    return ctrl.postJson(`game/${id}/mode`, {quickFlag}, {signal});
}

export async function postUndo(id, steps, {signal} = {}) {
    return ctrl.postJson(`game/${id}/undo`, {steps}, {signal});
}

export async function postSeek(id, toIndex, {signal} = {}) {
    return ctrl.postJson(`game/${id}/seek`, {toIndex}, {signal});
}

export async function postPreview(id, toIndex, {signal} = {}) {
    return ctrl.postJson(`game/${id}/preview`, {toIndex}, {signal});
}

export async function postRevive(id, toIndex, {signal} = {}) {
    return ctrl.postJson(`game/${id}/revive`, {toIndex}, {signal});
}
