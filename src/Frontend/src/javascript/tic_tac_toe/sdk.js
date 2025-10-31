// Core client-side orchestration (no rendering)
import { apiNew, apiPlay, apiBestMove, apiStatus, apiRestart } from './api.js';
import { canPlayLocally } from './validator.js';
import { saveSession, loadSession, clearSession } from './storage.js';
import { makeTelemetryHooks } from './telemetry.js';
import { withRetry } from './retry.js';

export function createTicTacToeSdk(opts = {}) {
  const telemetry = makeTelemetryHooks(opts.telemetry);

  let state = {
    game: null,
    inflightPlay: false,
    lastLatencyMs: 0,
    error: null,
    hint: null,
  };
  const subs = new Set();

  const setState = (patch) => {
    const prev = state;
    state = { ...state, ...patch };
    try { telemetry.onStateChange(prev, state); } catch {}
    subs.forEach(fn => { try { fn(state, prev); } catch {} });
  };

  const measure = async (fn) => {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const res = await fn();
    const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const ms = Math.round(t1 - t0);
    setState({ lastLatencyMs: ms });
    try { telemetry.onLatency(ms); } catch {}
    return res;
  };

  const actions = {
    async newGame(params) {
      const res = await measure(() => withRetry(() => apiNew(params)));
      if (res.error) { setState({ error: res.error }); throw res.error; }
      setState({ game: res.json.game, error: null, hint: null });
      saveSession({ gameId: res.json.game.id, params });
      return res.json.game;
    },

    async resumeLastGame() {
      const sess = loadSession();
      if (!sess) return null;
      const res = await measure(() => withRetry(() => apiStatus(sess.gameId)));
      if (res.error) { clearSession(); return null; }
      setState({ game: res.json.game, error: null });
      return res.json.game;
    },

    async refresh() {
      if (!state.game) return null;
      const res = await measure(() => withRetry(() => apiStatus(state.game.id)));
      if (!res.error) setState({ game: res.json.game });
      return res;
    },

    async play(row, col) {
      const g = state.game;
      if (!g) throw new Error('No game');
      if (!canPlayLocally(g, row, col)) return { blocked: true };

      // optimistic update
      const original = g;
      const optimistic = structuredClone(g);
      optimistic.board[row][col] = g.player;
      optimistic.player = g.player === 'X' ? 'O' : 'X';
      setState({ game: optimistic, inflightPlay: true });

      const res = await measure(() => apiPlay(original.id, row, col));
      if (res.error) {
        // rollback on error
        setState({ game: original, inflightPlay: false, error: res.error });
        try { telemetry.onError(res.error); } catch {}
        return res;
      }
      setState({ game: res.json.game, inflightPlay: false, error: null });
      return res;
    },

    async bestMove(opts = {}) {
      const g = state.game;
      if (!g) throw new Error('No game');
      const res = await measure(() => apiBestMove({ gameId: g.id, difficulty: opts.difficulty }));
      if (res.error) {
        setState({ error: res.error });
        try { telemetry.onError(res.error); } catch {}
        return res;
      }
      // po best-move refresh kvůli hints_used a dalším meta polím
      await actions.refresh();
      return res;
    },

    async restart() {
      const g = state.game;
      if (!g) throw new Error('No game');
      const res = await measure(() => apiRestart(g.id));
      if (res.error) {
        setState({ error: res.error });
        try { telemetry.onError(res.error); } catch {}
        return res;
      }
      const ng = res.json.game;
      setState({ game: ng, error: null, hint: null });
      // přepíšeme session novou hrou
      saveSession({
        gameId: ng.id,
        params: {
          size: ng.size,
          kToWin: ng.k_to_win,
          startMark: ng.start_mark,
          humanMark: ng.human_mark,
          mode: ng.mode,
          turnTimerSec: ng.turnTimerSec,
          difficulty: ng.difficulty,
        }
      });
      return res;
    },
  };

  return {
    // state
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    getState() { return state; },

    // actions
    actions,
  };
}
