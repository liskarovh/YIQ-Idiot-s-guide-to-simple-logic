import { useCallback, useMemo, useRef, useState } from 'react';
import { ttt, inBounds, isEmpty, isRunning } from '../features/ttt.client.js';
import { Status, Difficulty, Mode, StartMark } from '../shared/constants.js';

export function useGame() {
  const [game, setGame] = useState(null);        // DTO ze serveru
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingMove, setPendingMove] = useState(null); // ghost overlay
  const [hint, setHint] = useState(null);

  const [difficulty, setDifficulty] = useState(Difficulty.EASY);
  const [mode, setMode] = useState(Mode.PVP);
  const [startMark, setStartMark] = useState(StartMark.X);

  const newGame = useCallback(async (p) => {
    const payload = {
      size:       p?.size ?? 3,
      kToWin:     p?.kToWin ?? 3,
      mode:       p?.mode ?? mode,
      startMark:  p?.startMark ?? startMark,
      difficulty: p?.difficulty ?? difficulty,
    };
    console.log('[useGame] newGame() →', payload);

    setLoading(true); setError(null); setHint(null); setPendingMove(null);
    try {
      const dto = await ttt._fetch('/new', { method: 'POST', json: payload });
      console.log('[useGame] newGame() ←', dto);
      setGame(dto.game ?? dto);
    } catch (e) {
      console.warn('[useGame] newGame() ×', e);
      setError(e?.message || 'New game failed');
    } finally {
      setLoading(false);
    }
  }, [mode, startMark, difficulty]);

  const play = useCallback(async ({ row, col }) => {
    if (!game) return;
    console.log('[useGame] play() →', { gameId: game.id, row, col });

    // rychlá lokální validace (bez AI)
    if (!isRunning(game) || !inBounds(game, row, col) || !isEmpty(game, row, col)) {
      console.warn('[useGame] play() blocked: invalid move');
      setError('Invalid move');
      return;
    }

    setPendingMove({ row, col, player: game.player });
    setLoading(true); setError(null);
    try {
      const dto = await ttt._fetch('/play', { method: 'POST', json: { gameId: game.id, row, col } });
      console.log('[useGame] play() ←', dto);
      setGame(dto.game ?? dto);
      setHint(null);
    } catch (e) {
      console.warn('[useGame] play() ×', e);
      setError(e?.message || 'Play failed');
    } finally {
      setPendingMove(null);
      setLoading(false);
    }
  }, [game]);

  const bestMove = useCallback(async (d = difficulty) => {
    if (!game) return;
    console.log('[useGame] bestMove() →', { gameId: game.id, difficulty: d });

    setLoading(true); setError(null);
    try {
      const dto = await ttt._fetch('/best-move', { method: 'POST', json: { gameId: game.id, difficulty: d } });
      console.log('[useGame] bestMove() ←', dto);

      if (dto?.game) {
        setGame(dto.game);
        setHint(null);
      } else if (Array.isArray(dto?.move)) {
        const [row, col] = dto.move;
        setHint({ row, col, meta: dto?.meta || null });
      }
    } catch (e) {
      console.warn('[useGame] bestMove() ×', e);
      setError(e?.message || 'Best-move failed');
    } finally {
      setLoading(false);
    }
  }, [game, difficulty]);

  const restart = useCallback(async () => {
    if (!game) return;
    console.log('[useGame] restart() →', { gameId: game.id });

    setLoading(true); setError(null); setHint(null); setPendingMove(null);
    try {
      const dto = await ttt._fetch('/restart', { method: 'POST', json: { gameId: game.id } });
      console.log('[useGame] restart() ←', dto);
      setGame(dto.game ?? dto);
    } catch (e) {
      console.warn('[useGame] restart() ×', e);
      setError(e?.message || 'Restart failed');
    } finally {
      setLoading(false);
    }
  }, [game]);

  return {
    game, loading, error, pendingMove, hint,
    difficulty, mode, startMark,
    setDifficulty, setMode, setStartMark,
    newGame, play, bestMove, restart,
  };
}
