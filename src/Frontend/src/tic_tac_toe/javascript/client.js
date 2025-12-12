/**
 * @file    client.js
 * @brief   Minimalistic browser  API client for the Tic-Tac-Toe backend.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

/**
 * @typedef {Object} TttClientOptions
 * @property {string} [baseUrl]   Base URL to the API
 *                                (default: current browser origin + '/api/tictactoe')
 * @property {number} [timeoutMs] Per-request timeout in ms (default: 8000)
 * @property {number} [retries]   How many retries on network errors/5xx (default: 1)
 * @property {number} [backoffMs] Initial backoff between retries (default: 250)
 */

/* ========== Helpers (parameter normalization) ========== */

/**
 * Normalizes game mode value to "pvp" or "pve".
 */
export const normalizeMode = (m) => {
    const v = String(m ?? 'pvp').toLowerCase();
    return v === 'pve' ? 'pve' : 'pvp';
};

/**
 * Normalizes starting mark to "X" or "O" (default "X").
 */
export const normalizeStartMark = (s) => {
    const v = String(s ?? 'X').toUpperCase();
    return v === 'O' ? 'O' : 'X';
};

/**
 * Normalizes difficulty to "easy" | "medium" | "hard" (default "easy").
 */
export const normalizeDifficulty = (d) => {
    const v = String(d ?? 'easy').toLowerCase();
    return v === 'hard' ? 'hard' : v === 'medium' ? 'medium' : 'easy';
};

/**
 * Converts various nickname shapes to a trimmed string or undefined:
 * - string
 * - { nickname } / { name }
 */
export const toNick = (val) => {
    if (val == null) return undefined;

    if (typeof val === 'string') {
        const s = val.trim();
        return s.length ? s : undefined;
    }

    if (typeof val === 'object') {
        const s = (val.nickname ?? val.name ?? '').toString().trim();
        return s.length ? s : undefined;
    }

    const s = String(val).trim();
    return s.length ? s : undefined;
};

/* ========== Public factory ========== */

/**
 * Minimalistic API client for the Tic-Tac-Toe backend
 * Export: createTttClient({ baseUrl?, timeoutMs?, retries?, backoffMs? })
 *
 * @param {TttClientOptions} [options]
 * @returns {{ baseUrl:string, _fetch:Function, new:Function, newGame:Function,
 *            status:Function, play:Function, bestMove:Function, restart:Function }}
 */
export function createTttClient(options = {}) {
    const {
        baseUrl: optBaseUrl,
        timeoutMs = 8000,
        retries = 1,
        backoffMs = 250,
    } = options;

    // Base URL resolution
    const computedDefault =
        typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/api/tictactoe`
        : '/api/tictactoe';
    const baseUrl = String(optBaseUrl || computedDefault).replace(/\/+$/, '');

    // --- fetch with timeout + retry/backoff ---
    async function fetchWithRetry(path, { method = 'GET', json } = {}) {
        const url = `${baseUrl}${path}`;
        let lastErr;

        for (let attempt = 0; attempt <= retries; attempt++) {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), timeoutMs);

            try {
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: json ? JSON.stringify(json) : undefined,
                    signal: ctrl.signal,
                    credentials: 'same-origin',
                });
                clearTimeout(t);

                if (res.status >= 500 && attempt < retries) {
                    await new Promise((r) =>
                                          setTimeout(r, backoffMs * Math.pow(2, attempt)),
                    );
                    continue;
                }

                return res;
            } catch (err) {
                clearTimeout(t);
                lastErr = err;

                if (attempt < retries) {
                    await new Promise((r) =>
                                          setTimeout(r, backoffMs * Math.pow(2, attempt)),
                    );
                    continue;
                }
                throw err;
            }
        }

        throw lastErr;
    }

    /**
     * Internal JSON API wrapper that throws on non-2xx with parsed payload if possible.
     */
    async function api(path, { method = 'GET', json } = {}) {
        const res = await fetchWithRetry(path, { method, json });

        if (!res.ok) {
            let body = '';
            try {
                body = await res.text();
            } catch {
                // ignore
            }

            let payload;
            try {
                payload = JSON.parse(body);
            } catch {
                // ignore
            }

            const e = new Error(
                payload?.error?.message || body || `HTTP ${res.status}`,
            );
            e.status = res.status;
            e.payload = payload;
            throw e;
        }

        return res.json();
    }

    // ========= Safe builder for /new =========

    /**
     * Builds a safe payload for the /new endpoint from possibly partial UI state.
     */
    function buildNewPayload(p = {}) {
        const mode = normalizeMode(p?.mode);

        const px =
            toNick(p?.players?.X?.nickname) ??
            toNick(p?.players?.x?.nickname) ??
            toNick(p?.players?.X) ??
            toNick(p?.players?.x) ??
            toNick(p?.playerName) ??
            undefined;

        const po =
            toNick(p?.players?.O?.nickname) ??
            toNick(p?.players?.o?.nickname) ??
            toNick(p?.players?.O) ??
            toNick(p?.players?.o) ??
            undefined;

        const safeX = px ?? 'Player1';
        const safeO = po ?? (mode === 'pve' ? 'Computer' : 'Player2');

        const startMark = normalizeStartMark(p?.startMark);

        return {
            size: Number(p?.size ?? 3),
            kToWin: Number(p?.kToWin ?? p?.size ?? 3),
            mode,
            startMark,
            difficulty: normalizeDifficulty(p?.difficulty),
            humanMark: p?.humanMark ?? startMark,
            turnTimerSec: Number(p?.turnTimerSec) || 0,
            players: {
                X: { nickname: String(safeX) },
                O: { nickname: String(safeO) },
            },
        };
    }

    // ---- public client methods ----

    /**
     * Starts a new game.
     */
    async function newGame(p) {
        const body = buildNewPayload(p || {});
        return api('/new', { method: 'POST', json: body });
    }

    /**
     * Fetches current status for a given game id.
     */
    async function status(id) {
        if (!id) throw new Error('status(gameId) required');
        return api(`/status/${encodeURIComponent(id)}`);
    }

    /**
     * Submits a move for the current game.
     */
    async function play(p) {
        return api('/play', { method: 'POST', json: p });
    }

    /**
     * Asks backend for the best move suggestion.
     */
    async function bestMove(p) {
        return api('/best-move', { method: 'POST', json: p });
    }

    /**
     * Restarts the current game with the same configuration.
     */
    async function restart(p) {
        return api('/restart', { method: 'POST', json: p });
    }

    return {
        baseUrl,
        _fetch: api,
        new: newGame,
        newGame,
        status,
        play,
        bestMove,
        restart,
    };
}
