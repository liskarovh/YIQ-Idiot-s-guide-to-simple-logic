// src/Frontend/src/react/tic_tac_toe/hooks/useGame.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { ttt } from '../features/ttt.client.js';
import { Difficulty, Mode, StartMark } from '../shared/constants.js';
import { useLocation } from 'react-router-dom';

const normMode  = v => (String(v ?? '').toLowerCase().includes('pve') ? 'pve' : 'pvp');
const normDiff  = v => (String(v ?? '').toLowerCase().includes('hard')
  ? 'hard'
  : String(v ?? '').toLowerCase().includes('medium') ? 'medium' : 'easy');
const normStart = v => (String(v).toUpperCase() === 'O' ? 'O' : 'X');

function extractPlayers(playersDto) {
  const X = playersDto?.X || playersDto?.x;
  const O = playersDto?.O || playersDto?.o;
  return { x: X?.nickname ?? null, o: O?.nickname ?? null };
}

function computePlayersForNew({ mode, players, playerName }) {
  const m  = normMode(mode);
  const px =
    players?.X?.nickname ??
    players?.x?.nickname ??
    players?.X ??
    players?.x ??
    playerName ??
    'Player1';
  const po =
    players?.O?.nickname ??
    players?.o?.nickname ??
    players?.O ??
    players?.o ??
    (m === 'pve' ? 'Computer' : 'Player2');
  return { X: { nickname: String(px) }, O: { nickname: String(po) } };
}

export function useGame() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingMove, setPendingMove] = useState(null);

  // HINT = /best-move(HARD) výsledek (včetně explainRich/statistik)
  const [hint, setHint] = useState(null);    // { move, explain, explainRich, stats, analysis }
  // Poslední serverový autoplay (PvE) z /play (včetně explainRich, pokud BE vrací)
  const [lastAi, setLastAi] = useState(null);

  const location = useLocation();
  const didInitRef = useRef(false);

  const [difficulty, setDifficulty] = useState(Difficulty.EASY);
  const [mode, setMode] = useState(Mode.PVP);
  const [startMark, setStartMark] = useState(StartMark.X);

  // Přezdívky držíme pouze jako odvozený runtime stav z BE
  const [players, setPlayers] = useState({ x: null, o: null });

  // ───────────────────────── /new ─────────────────────────
  const newGame = useCallback(async (p) => {
    const payload = {
      size:         Number(p?.size ?? 3),
      kToWin:       Number(p?.kToWin ?? p?.size ?? 3),
      mode:         normMode(p?.mode ?? mode),
      startMark:    normStart(p?.startMark ?? startMark),
      difficulty:   normDiff(p?.difficulty ?? difficulty),
      humanMark:    p?.humanMark,
      turnTimerSec: Number(p?.turnTimerSec) || 0,
      // ochrana: vždy pošli aspoň jedno z: players | playerName
      players:      computePlayersForNew({ mode: p?.mode ?? mode, players: p?.players, playerName: p?.playerName }),
      playerName:   p?.playerName ?? undefined,
    };

    setMode(payload.mode);
    setStartMark(payload.startMark);
    setDifficulty(payload.difficulty);

    setLoading(true); setError(null); setHint(null); setPendingMove(null); setLastAi(null);
    try {
      const dto = await ttt.new(payload);
      const g = dto?.game ?? dto;
      setGame(g);
      sessionStorage.setItem('ttt.lastGameId', g.id);
      if (g?.players) setPlayers(extractPlayers(g.players));
    } catch (e) {
      console.warn('[useGame] newGame() ×', e);
      setError(e?.message || 'New game failed');
    } finally {
      setLoading(false);
    }
  }, [mode, startMark, difficulty]);

  // ───────────────────────── init-from-settings ─────────────────────────
  const initFromSettings = useCallback(() => {
    if (game) return true;
    const raw = sessionStorage.getItem('ttt.settings');
    if (!raw) return false;
    try {
      const cfg = JSON.parse(raw);
      const m  = normMode(cfg?.mode);
      const sm = normStart(cfg?.startMark);
      const df = normDiff(cfg?.difficulty);
      setMode(m);
      setStartMark(sm);
      setDifficulty(df);

      const playerName =
        cfg?.playerName ??
        cfg?.players?.X?.nickname ??
        cfg?.players?.x?.nickname ??
        cfg?.players?.X ??
        cfg?.players?.x ??
        undefined;

      newGame({
        size: cfg?.size,
        kToWin: cfg?.kToWin ?? cfg?.size,
        mode: cfg?.mode,
        startMark: cfg?.startMark,
        difficulty: cfg?.difficulty,
        turnTimerSec: cfg?.timer?.enabled ? cfg?.timer?.seconds : 0,
        humanMark: cfg?.humanMark,
        playerName,
        players: cfg?.players ?? undefined,
      });
      return true;
    } catch (e) {
      console.warn('[useGame] initFromSettings ×', e);
      sessionStorage.removeItem('ttt.settings');
      return false;
    }
  }, [game, newGame]);

  // ───────────────────────── initial adopt (/status || settings) ─────────────────────────
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const gid = new URLSearchParams(location.search).get('gid');
    const lastId = gid || sessionStorage.getItem('ttt.lastGameId');

    if (lastId) {
      (async () => {
        try {
          setLoading(true);
          const dto = await ttt.status(lastId);
          const g = dto?.game ?? dto;
          setGame(g);
          sessionStorage.setItem('ttt.lastGameId', g.id);
          setMode(g?.mode || Mode.PVP);
          setStartMark(g?.start_mark || StartMark.X);
          setDifficulty(g?.difficulty || Difficulty.EASY);
          if (g?.players) setPlayers(extractPlayers(g.players));
        } catch (e) {
          console.warn('[useGame] resume/status ×', e);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      initFromSettings();
    }
    // ZÁMĚRNĚ bez [initFromSettings] v deps → chceme jen první mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // ───────────────────────── /play ─────────────────────────
  const play = useCallback(async ({ row, col }) => {
    if (!game) return;

    const size = game?.size ?? (game?.board?.length ?? 0);
    const running = (String(game?.status || '').toLowerCase() === 'running');
    const inBoundsRaw = Number.isInteger(row) && Number.isInteger(col) &&
                        row >= 0 && col >= 0 && row < size && col < size;
    const cellVal = game?.board?.[row]?.[col];
    const emptyRaw = (cellVal === '.');

    if (!running || !inBoundsRaw || !emptyRaw) {
      setError('Invalid move');
      return;
    }

    setPendingMove({ row, col, player: game.player });
    setLoading(true); setError(null);

    try {
      // BE může rovnou vrátit i autoplay bota + explainRich (PvE)
      const played = await ttt.play({ gameId: game.id, row, col });
      const g1 = played?.game ?? played;
      setGame(g1);
      if (g1?.players) setPlayers(extractPlayers(g1.players));
      setHint(null);
      setLastAi(played?.ai || null);
    } catch (e) {
      console.warn('[useGame] play() ×', e);
      setError(e?.message || 'Play failed');
    } finally {
      setPendingMove(null);
      setLoading(false);
    }
  }, [game]);

  // ───────────────────────── /best-move (HARD poradna) ─────────────────────────
  const requestBestMove = useCallback(async () => {
    if (!game) throw new Error('No active game');

    // Hard poradna – BE může ignorovat klientskou obtížnost
    const dto = await ttt.bestMoveHard({ gameId: game.id });

    const move        = Array.isArray(dto?.move) ? dto.move : null;
    const explain     = dto?.explain ?? dto?.meta ?? '';
    const explainRich = dto?.explainRich ?? null;
    const stats       = dto?.stats ?? null;
    const analysis    = dto?.analysis ?? null;

    if (move) setHint({ move, explain, explainRich, stats, analysis });
    else setHint(null);

    return { move, explain, explainRich, stats, analysis };
  }, [game]);

  const getBestMove = requestBestMove;

  const bestMove = useCallback(async () => {
    if (!game) return null;
    setLoading(true); setError(null);
    try {
      return await requestBestMove();
    } catch (e) {
      console.warn('[useGame] bestMove() ×', e);
      setError(e?.message || 'Best-move failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [game, requestBestMove]);

  // ───────────────────────── /restart ─────────────────────────
  const restart = useCallback(async () => {
    if (!game) return;
    setLoading(true); setError(null); setHint(null); setPendingMove(null); setLastAi(null);
    try {
      const dto = await ttt.restart({ gameId: game.id });
      const g = dto?.game ?? dto;
      setGame(g);
      if (g?.players) setPlayers(extractPlayers(g.players));
      sessionStorage.setItem('ttt.lastGameId', g.id);
    } catch (e) {
      console.warn('[useGame] restart() ×', e);
      setError(e?.message || 'Restart failed');
    } finally {
      setLoading(false);
    }
  }, [game]);

  // ───────────────────────── Timeout (BE + bezpečný fallback) ─────────────────────────
  const timeoutInFlightRef = useRef(false);

  // Lokální ukončení jako timeout (bez BE)
  const endAsTimeout = useCallback((whoTimedOut) => {
    setGame((g) => {
      if (!g) return g;
      const alreadyEnded = String(g.status || '').toLowerCase() !== 'running';
      if (alreadyEnded) return g;

      const current = String(whoTimedOut ?? g.player ?? 'X').toUpperCase();
      const winner  = current === 'X' ? 'O' : 'X';
      // Nastavíme status 'timeout', ať se vykreslí TimeRanOut panel.
      return { ...g, status: 'timeout', winner };
    });
  }, []);

  // Preferovaný způsob: zavolat BE, aby ukončil hru jako timeout
  // ───────────────────────── Timeout (BE preferované) ─────────────────────────
    const timeoutLose = useCallback(async () => {
      if (!game) return;
      try {
        if (ttt?.timeoutLose) {
          const dto = await ttt.timeoutLose({ gameId: game.id });
          const g = dto?.game ?? dto;
          if (g) {
            setGame(g);
            if (g?.players) setPlayers(extractPlayers(g.players));
            sessionStorage.setItem('ttt.lastGameId', g.id);
            return;
          }
        }
      } catch (e) {
        console.warn('[useGame] timeoutLose() BE × → fallback FE', e);
      }
      // FE fallback: ukonči jako timeout výhrou druhého hráče
      setGame((g) => {
        if (!g) return g;
        if (String(g.status || '').toLowerCase() !== 'running') return g;
        // kdo byl na tahu, prohrál na čas
        const current = String(g.player ?? 'X').toUpperCase();
        const winner  = current === 'X' ? 'O' : 'X';
        return { ...g, status: 'timeout', winner };
      });
    }, [game]);


  return {
    game, loading, error, pendingMove, hint, lastAi,
    difficulty, mode, startMark, players,
    setDifficulty, setMode, setStartMark,
    newGame, initFromSettings,
    play, bestMove, requestBestMove, getBestMove,
    restart,
    // Timeout API
    timeoutLose,   // → zavolá BE /timeout-lose a nastaví oficiální stav
    endAsTimeout,  // → čistě lokální fallback (status:'timeout', winner = opačný hráč)
  };
}
