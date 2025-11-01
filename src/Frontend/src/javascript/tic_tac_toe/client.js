/* tic_tac_toe/client.js
 * Minimalistic API client for Tic-Tac-Toe backend (browser ESM).
 * Export:
 *   createTttClient({ baseUrl?, timeoutMs?, retries?, backoffMs? })
 *   // Pure validators (no side-effects):
 *   inBounds(gameDto, r, c), isEmpty(gameDto, r, c), isRunning(gameDto)
 *
 * FE contract:
 * - React jen UI; validace volá FE explicitně z tohoto modulu.
 * - AI/best-move vždy řeší backend.
 */

/**
 * @typedef {Object} TttClientOptions
 * @property {string} [baseUrl]     Base URL to the API (default: `${location.origin}/api/tictactoe`)
 * @property {number} [timeoutMs]   Per-request timeout in ms (default: 8000)
 * @property {number} [retries]     How many retries on network errors/5xx (default: 1)
 * @property {number} [backoffMs]   Initial backoff between retries (default: 250)
 */

/* ========== Pure validators (shared, no AI here) ========== */

export const inBounds = (game, r, c) => {
  const n = Array.isArray(game?.board) ? game.board.length : -1;
  return Number.isInteger(r) && Number.isInteger(c) && r >= 0 && c >= 0 && r < n && c < n;
};

export const isEmpty = (game, r, c) => {
  return Array.isArray(game?.board) && game.board?.[r]?.[c] === ".";
};

export const isRunning = (game) => game?.status === "running";

/**
 * Combined quick local move check — convenience (bounds + emptiness + running).
 * NEUPRAVUJE DTO, jen vrací výsledek. Backend je autorita.
 */
export function validateLocalMove(game, row, col) {
  if (!isRunning(game)) return { ok: false, reason: "status" };
  if (!inBounds(game, row, col)) return { ok: false, reason: "bounds" };
  if (!isEmpty(game, row, col)) return { ok: false, reason: "occupied" };
  return { ok: true };
}

/* ========== Fetch infra (timeout/retry/backoff) ========== */

async function fetchWithRetry(url, init, { timeoutMs, retries, backoffMs }) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(t);
      // retry on 5xx; pass through other statuses
      if (res.status >= 500 && attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(t);
      lastErr = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function makeHttpError(res) {
  let bodyText = "";
  try { bodyText = await res.text(); } catch {}
  let payload;
  try { payload = JSON.parse(bodyText); } catch {}
  const msg =
    payload?.error?.message ||
    payload?.message ||
    bodyText ||
    `HTTP ${res.status}`;
  const e = new Error(msg);
  e.status = res.status;
  e.payload = payload;
  return e;
}

/* ========== Helpers (param normalization) ========== */

const normalizeMode = (m) => {
  const v = String(m ?? "pvp").toLowerCase();
  return v === "pve" ? "pve" : "pvp";
};
const normalizeStartMark = (s) => {
  const v = String(s ?? "X").toUpperCase();
  return v === "O" ? "O" : "X";
};
const normalizeDifficulty = (d) => {
  const v = String(d ?? "easy").toLowerCase();
  return v === "hard" ? "hard" : v === "medium" ? "medium" : "easy";
};

/* ========== Public factory ========== */

/**
 * Minimalistic API client for Tic-Tac-Toe backend (browser ESM).
 * Export: createTttClient({ baseUrl?, timeoutMs?, retries?, backoffMs? })
 */
export function createTttClient(options = {}) {
  const {
    baseUrl: optBaseUrl,
    timeoutMs = 8000,
    retries = 1,
    backoffMs = 250,
  } = options;

  // Bezpečný výpočet base URL (CRA ESLint: používej window.location)
  const computedDefault =
    (typeof window !== 'undefined' && window.location?.origin)
      ? `${window.location.origin}/api/tictactoe`
      : '/api/tictactoe';

  // ← Tohle je jediný baseUrl, který dál používáme
  const baseUrl = String(optBaseUrl || computedDefault).replace(/\/+$/, '');

  // --- fetch s timeoutem a backoffem ---
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
          await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
          continue;
        }
        return res;
      } catch (err) {
        clearTimeout(t);
        lastErr = err;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  async function api(path, { method = 'GET', json } = {}) {
    const res = await fetchWithRetry(path, { method, json });
    if (!res.ok) {
      let body = '';
      try { body = await res.text(); } catch {}
      let payload;
      try { payload = JSON.parse(body); } catch {}
      const e = new Error(payload?.error?.message || body || `HTTP ${res.status}`);
      e.status = res.status;
      e.payload = payload;
      throw e;
    }
    return res.json();
  }

  // ---- veřejné metody klienta ----
  async function newGame(p)     { return api('/new',         { method: 'POST', json: p }); }
  async function status(id)     { if(!id) throw new Error('status(gameId) required'); return api(`/status/${encodeURIComponent(id)}`); }
  async function play(p)        { return api('/play',        { method: 'POST', json: p }); }
  async function bestMove(p)    { return api('/best-move',   { method: 'POST', json: p }); }
  async function validateMove(p){ return api('/validate-move',{ method: 'POST', json: p }); }
  async function restart(p)     { return api('/restart',     { method: 'POST', json: p }); }

  return {
    baseUrl,
    _fetch: api,
    new: newGame,
    newGame,
    status,
    play,
    bestMove,
    validateMove,
    restart,
  };
}


/* Optional default export for convenience */
export default { createTttClient, inBounds, isEmpty, isRunning, validateLocalMove };
