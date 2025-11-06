// localStorage-backed lightweight session (last game)
const KEY = 'ttt.session.v1';

export function saveSession({ gameId, params }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ gameId, params, ts: Date.now() }));
  } catch {
    // ignore
  }
}

export function loadSession() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && typeof v.gameId === 'string') return v;
  } catch {}
  return null;
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch {}
}
