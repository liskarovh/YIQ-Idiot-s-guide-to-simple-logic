// Lightweight HTTP wrapper for Tic-Tac-Toe backend (no UI here)

const BASE = (() => {
  // default = stejné origin jako běží frontend (proxy/dev server)
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}`;
  }
  return ''; // fallback
})();

function toErrorPayload(status, json) {
  // sjednocené chybové tělo
  if (json && json.error && typeof json.error === 'object') {
    return { ...json.error, status };
  }
  return { code: 'HttpError', message: `HTTP ${status}`, status };
}

async function fetchJson(path, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: toErrorPayload(res.status, json) };
    }
    return { ok: true, status: res.status, json };
  } catch (e) {
    return { ok: false, status: 0, error: { code: 'NetworkError', message: String(e) } };
  }
}

// === public API calls ===
export function apiNew(params) {
  return fetchJson('/api/tictactoe/new', { method: 'POST', body: params });
}

export function apiStatus(gameId) {
  return fetchJson(`/api/tictactoe/status/${encodeURIComponent(gameId)}`, { method: 'GET' });
}

export function apiPlay(gameId, row, col) {
  return fetchJson('/api/tictactoe/play', { method: 'POST', body: { gameId, row, col } });
}

// stateful: { gameId, difficulty? }  | stateless: { board, size, kToWin, player, difficulty? }
export function apiBestMove(body) {
  return fetchJson('/api/tictactoe/best-move', { method: 'POST', body });
}

export function apiRestart(gameId) {
  return fetchJson('/api/tictactoe/restart', { method: 'POST', body: { gameId } });
}
