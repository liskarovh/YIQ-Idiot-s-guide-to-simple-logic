/* react/client.js
 * Minimalistic API client for Tic-Tac-Toe backend (browser ESM).
 * Export:
 *   createTttClient({ baseUrl?, timeoutMs?, retries?, backoffMs? })
 *   // Pure validators (no side effects):
 *   inBounds(gameDto, r, c), isEmpty(gameDto, r, c), isRunning(gameDto), validateLocalMove()
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

const toNick = (val) => {
  // string / {nickname} / {name} / {nick}
  if (val == null) return undefined;
  if (typeof val === 'string') {
    const s = val.trim();
    return s.length ? s : undefined;
  }
  if (typeof val === 'object') {
    const s = (val.nickname ?? val.name ?? val.nick ?? '').toString().trim();
    return s.length ? s : undefined;
  }
  const s = String(val).trim();
  return s.length ? s : undefined;
};

const deepClone = (x) => {
  try { return structuredClone ? structuredClone(x) : JSON.parse(JSON.stringify(x)); }
  catch { return x; }
};

const DEV = typeof window !== 'undefined' && !!window.__TTT_DEBUG__;
const now = () => Date.now();

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

  // Base URL
  const computedDefault =
    (typeof window !== 'undefined' && window.location?.origin)
      ? `${window.location.origin}/api/tictactoe`
      : '/api/tictactoe';
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

  // ========= Forenzní a bezpečnostní vrstva pro /new =========

  let __newSeq = 0;
  let __lastNewTs = 0;

  function buildNewPayload(p) {
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

    // Fallbacky – nikdy neposílej prázdné stringy
    const safeX = px ?? 'Player1';
    const safeO = po ?? (mode === 'pve' ? 'Computer' : 'Player2');

    const startMark = normalizeStartMark(p?.startMark);
    return {
      size: Number(p?.size ?? 3),
      kToWin: Number(p?.kToWin ?? p?.size ?? 3),
      mode,
      startMark,
      difficulty: normalizeDifficulty(p?.difficulty),
      humanMark: p?.humanMark ?? startMark, // PvE default: human = start
      turnTimerSec: Number(p?.turnTimerSec) || 0,
      players: { X: { nickname: String(safeX) }, O: { nickname: String(safeO) } },
    };
  }

  function traceNew(pBuilt, pOriginal) {
    if (!DEV) return;
    const seq = ++__newSeq;
    const throttleMs = Number(window.__TTT_NEW_THROTTLE_MS ?? 800);
    console.groupCollapsed(
      `%c[ttt.new] #${seq}`,
      'color:#6cf;font-weight:bold',
      { throttleMs }
    );
    console.log('original:', deepClone(pOriginal));
    console.log('built:', deepClone(pBuilt));
    console.trace('call stack');
    console.groupEnd();
  }

  function throttleNew() {
    const throttleMs = Number(window.__TTT_NEW_THROTTLE_MS ?? 800);
    const t = now();
    if (t - __lastNewTs < throttleMs) {
      if (DEV) console.warn('[ttt.new] blocked duplicate within', throttleMs, 'ms');
      throw new Error('Duplicate /new blocked (throttle)');
    }
    __lastNewTs = t;
  }

  // ---- veřejné metody klienta ----

  async function newGame(p) {
    // Bezpečnost + forenzní log
    throttleNew();
    const body = buildNewPayload(p || {});
    traceNew(body, p);

    return api('/new', { method: 'POST', json: body });
  }

  async function status(id) {
    if (!id) throw new Error('status(gameId) required');
    return api(`/status/${encodeURIComponent(id)}`);
  }

  async function play(p)        { return api('/play',          { method: 'POST', json: p }); }
  async function bestMove(p)    { return api('/best-move',     { method: 'POST', json: p }); }
  async function validateMove(p){ return api('/validate-move', { method: 'POST', json: p }); }
  async function restart(p)     { return api('/restart',       { method: 'POST', json: p }); }

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
