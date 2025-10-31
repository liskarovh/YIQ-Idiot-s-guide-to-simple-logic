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

export function createTttClient(opts = {}) {
  const baseUrl = (opts.baseUrl || `${location.origin}/api/tictactoe`).replace(/\/+$/, "");
  const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : 8000;
  const retries = Number.isFinite(opts.retries) ? opts.retries : 1;
  const backoffMs = Number.isFinite(opts.backoffMs) ? opts.backoffMs : 250;

  async function apiFetch(path, { method = "GET", json } = {}) {
    const url = `${baseUrl}${path}`;
    const init = {
      method,
      headers: { "Content-Type": "application/json" },
      body: json ? JSON.stringify(json) : undefined,
      credentials: "same-origin",
    };
    const res = await fetchWithRetry(url, init, { timeoutMs, retries, backoffMs });
    if (!res.ok) throw await makeHttpError(res);
    return res.json();
  }

  /** Create new game. */
  async function newGame(p) {
    const payload = {
      size: p.size,
      kToWin: p.kToWin,
      startMark: normalizeStartMark(p.startMark),
      mode: normalizeMode(p.mode),
      humanMark: p.humanMark ? normalizeStartMark(p.humanMark) : undefined,
      turnTimerSec: p.turnTimerSec,
      difficulty: p.difficulty ? normalizeDifficulty(p.difficulty) : undefined,
    };
    return apiFetch("/new", { method: "POST", json: payload });
  }

  /** Get status/state (supports both /state/:id and /status/:id). */
  async function status(gameId) {
    if (!gameId) throw new Error("status(gameId) requires gameId");
    try {
      return await apiFetch(`/state/${encodeURIComponent(gameId)}`, { method: "GET" });
    } catch (e) {
      if (e?.status === 404) throw e; // real 404
      // if /state not available, try /status
      return apiFetch(`/status/${encodeURIComponent(gameId)}`, { method: "GET" });
    }
  }

  /** Back-compat alias. */
  const state = status;

  /**
   * Play a move.
   * @param {{gameId:string,row:number,col:number}} p
   * @param {{game?:{board:string[][],status:string}, validate?:boolean}} [ctx]
   * - FE má validace v tomto modulu; tohle je jen opt-in guard (nepoužívá se pro AI/autoritu).
   */
  async function play(p, ctx) {
    if (ctx?.validate && ctx?.game) {
      const v = validateLocalMove(ctx.game, p.row, p.col);
      if (!v.ok) {
        const err = new Error(`Invalid move: ${v.reason}`);
        err.code = "LocalInvalidMove";
        throw err;
      }
    }
    return apiFetch("/play", { method: "POST", json: p });
  }

  /** Best move — backend only (no local AI). */
  async function bestMove(p) {
    const payload = {
      ...p,
      difficulty: p?.difficulty ? normalizeDifficulty(p.difficulty) : undefined,
    };
    return apiFetch("/best-move", { method: "POST", json: payload });
  }

  /** Validate move using backend (stateless). */
  async function validateMove(p) {
    return apiFetch("/validate-move", { method: "POST", json: p });
  }

  /** Restart game with the same settings. */
  async function restart(p) {
    return apiFetch("/restart", { method: "POST", json: p });
  }

  return {
    // Low-level fetch (debug)
    _fetch: apiFetch,
    // Validators (pure)
    inBounds,
    isEmpty,
    isRunning,
    validateLocalMove,
    // Endpoints
    new: newGame,
    newGame,
    status,
    state,
    play,
    bestMove,
    validateMove,
    restart,
    // Debug info
    baseUrl,
    version: "0.2.0",
  };
}

/* Optional default export for convenience */
export default { createTttClient, inBounds, isEmpty, isRunning, validateLocalMove };
