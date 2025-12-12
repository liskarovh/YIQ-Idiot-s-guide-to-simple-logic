/**
 * @file    ttt.client.js
 * @brief   Frontend client wrapper for the Tic-Tac-Toe backend.
 *
 * @author  Hana Liškařová
 * @date    2025-12-12
 */

import { getApiBaseUrl } from './env.js';
import { createTttClient } from './client.js';

// ───────────────────────── helpers ─────────────────────────

/**
 * Deeply freezes an object (in-place) to avoid accidental mutation in dev.
 *
 * @param {any} obj Object to freeze.
 * @returns {any} The same object, frozen.
 */
function deepFreeze(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    Object.freeze(obj);
    for (const k of Object.getOwnPropertyNames(obj)) {
        const v = obj[k];
        if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v);
    }
    return obj;
}

const isDev = () =>
    (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production');

/**
 * Normalizes the mode value to "pve" or "pvp".
 */
const normalizeMode = (m) => {
    const s = String(m ?? '').toLowerCase();
    if (s.includes('pve') || s.includes('bot')) return 'pve';
    if (s.includes('pvp') || s.includes('2'))   return 'pvp';
    return 'pvp';
};

const normNick = (v) => {
    if (v == null) return undefined;
    const s = String(
        typeof v === 'object' ? (v.nickname ?? v.name ?? '') : v
    ).trim();
    return s.length ? s : undefined;
};

/**
 * Builds a normalized players object for X and O from various input shapes.
 */
const buildPlayers = (p) => {
    const mode = normalizeMode(p?.mode);
    const px =
        normNick(p?.players?.X?.nickname) ??
        normNick(p?.players?.x?.nickname) ??
        normNick(p?.players?.X) ??
        normNick(p?.players?.x) ??
        normNick(p?.playerName);
    const po =
        normNick(p?.players?.O?.nickname) ??
        normNick(p?.players?.o?.nickname) ??
        normNick(p?.players?.O) ??
        normNick(p?.players?.o);
    return {
        X: { nickname: String(px ?? 'Player1') },
        O: { nickname: String(po ?? (mode === 'pve' ? 'Computer' : 'Player2')) },
    };
};

const normalizeStartMark = (s) => {
    const v = String(s ?? 'X').toUpperCase();
    return v === 'O' ? 'O' : 'X';
};

const normalizeDifficulty = (d) => {
    const v = String(d ?? 'easy').toLowerCase();
    return v === 'hard' ? 'hard' : v === 'medium' ? 'medium' : 'easy';
};

// ───────────────────────── client instance ─────────────────────────

/**
 * Core Tic-Tac-Toe API client instance.
 */
export const ttt = createTttClient({ baseUrl: getApiBaseUrl() });

// Debug: show API base URL
console.log('[ENV] API baseUrl =', ttt?.baseUrl || getApiBaseUrl());
if (typeof window !== 'undefined') window.__ttt = ttt;

// Debug wrapper for all HTTP calls
if (!ttt._debugWrapped) {
    const orig = ttt._fetch;
    ttt._debugWrapped = true;
    ttt._fetch = async (pathOrArgs, opts) => {
        console.log('[HTTP →]', pathOrArgs, opts || {});
        try {
            const json = await orig(pathOrArgs, opts);
            if (isDev() && json && typeof json === 'object') {
                try { deepFreeze(json); } catch {}
            }
            console.log('[HTTP ←]', json);
            return json;
        } catch (e) {
            console.warn('[HTTP ×]', e);
            throw e;
        }
    };
}

// ───────────────────────── safe builder for /new ─────────────────────────

/**
 * Builds a safe payload for /new from potentially messy UI state.
 */
function buildNewPayload(p = {}) {
    const mode       = normalizeMode(p.mode);
    const startMark  = normalizeStartMark(p.startMark);
    const difficulty = normalizeDifficulty(p.difficulty);
    const players    = buildPlayers(p);

    return {
        size: Number(p.size ?? 3),
        kToWin: Number(p.kToWin ?? p.size ?? 3),
        startMark,
        mode,
        difficulty,
        turnTimerSec: Number(p.turnTimerSec) || 0,
        humanMark: p.humanMark ?? (mode === 'pve' ? startMark : undefined),
        players,
        playerName: normNick(p.playerName) ?? players?.X?.nickname ?? 'Player1',
    };
}

// Convenience methods
ttt.new = (p = {}) => {
    const body = buildNewPayload(p);
    return ttt._fetch('/new', { method: 'POST', json: body });
};

ttt.status   = (id) => ttt._fetch(`/status/${encodeURIComponent(id)}`, { method: 'GET' });
ttt.play     = (p)  => ttt._fetch('/play',      { method: 'POST', json: p });
ttt.bestMove = (p)  => ttt._fetch('/best-move', { method: 'POST', json: p });
ttt.restart  = (p)  => ttt._fetch('/restart',   { method: 'POST', json: p });

// ───────────────────────── helpers ─────────────────────────

/**
 * Stateful helper: server always evaluates best move on HARD difficulty.
 */
ttt.bestMoveHard = ({ gameId }) => {
    if (!gameId) throw new Error('bestMoveHard: gameId is required');
    return ttt._fetch('/best-move', { method: 'POST', json: { gameId } });
};

/**
 * Stateless best-move helper.
 */
ttt.bestMoveStateless = ({ board, size, kToWin, player, difficulty }) => {
    if (!Array.isArray(board)) throw new Error('bestMoveStateless: board is required');
    return ttt._fetch('/best-move', {
        method: 'POST',
        json: {
            board,
            size: Number(size),
            kToWin: Number(kToWin),
            player: String(player ?? 'X').toUpperCase(),
            difficulty: normalizeDifficulty(difficulty),
        },
    });
};

// ───────────────────────── timeout lose  ─────────────────────────

/**
 * Marks the game as lost on timeout by calling the backend endpoint.
 */
ttt.timeoutLose = ({ gameId, reason = 'time' }) => {
    if (!gameId) throw new Error('timeoutLose: gameId is required');
    return ttt._fetch('/timeout-lose', { method: 'POST', json: { gameId, reason } });
};
