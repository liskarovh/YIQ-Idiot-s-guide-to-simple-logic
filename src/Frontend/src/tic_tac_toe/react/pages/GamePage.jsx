// src/Frontend/src/react/tic_tac_toe/pages/GamePage.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../../../components/Header';

import Toolbar from '../components/toolbar.jsx';
import AfterGameToolbar from '../components/afterGameToolbar.jsx';

import Board from '../components/board.jsx';
import BestMoveHint from '../components/best_move/bestMoveHint.jsx';
import BestMoveOverlay from '../components/best_move/bestMoveOverlay.jsx';
import UnderHeader from '../components/underHeader.jsx';
import GameInfoPanel from '../components/infoPanels/gameInfoPanel.jsx';
import WinInfoPanel from '../components/infoPanels/winInfoPanel.jsx';
import LoseInfoPanel from '../components/infoPanels/loseInfoPanel.jsx';
import DrawInfoPanel from '../components/infoPanels/drawInfoPanel.jsx';
import PvPInfoPanel from '../components/infoPanels/pvpInfoPanel.jsx';
import TimeRanOutPanel from '../components/infoPanels/timeRanOutPanel.jsx';
import { useGame } from '../hooks/useGame.js';
import { ttt } from '../features/ttt.client.js'; // fallback pro /best-move

export default function GamePage() {
  const navigate = useNavigate();

  const {
    game,
    loading,
    pendingMove,
    bestMove,
    restart,
    play,
    mode,
    players,
    hint,
    timeoutLose, // BE timeout (pokud existuje)
    endAsTimeout, // FE fallback (z useGame)
  } = useGame();

  const [paused, setPaused] = useState(false);

  // ====== Derivace čistě z DTO ======
  const size = Number.isFinite(Number(game?.size)) ? Number(game.size) : null;
  const kToWin =
    Number(game?.k_to_win ?? game?.goal ?? game?.kToWin ?? 0) || null;
  const difficulty =
    game?.difficulty ??
    game?.settings?.difficulty ??
    game?.ai?.difficulty ??
    null;

  const board = Array.isArray(game?.board) ? game.board : null;

  // Výsledek / status
  const winner = game?.winner ?? game?.game?.winner ?? null; // 'X' | 'O' | null
  const rawStatus = game?.status ?? game?.game?.status ?? 'running';
  const status = String(rawStatus).toLowerCase(); // 'running' | 'win' | 'draw' | 'timeout' | 'forfeit'...
  const ended = ['win', 'draw', 'timeout', 'forfeit'].includes(status);

  const humanMark = (() => {
    const hm = game?.human_mark ?? game?.humanMark;
    return hm ? String(hm).toUpperCase() : null;
  })();
  const isHumanWinner =
    ended && humanMark && String(winner).toUpperCase() === humanMark;

  // Výherní sekvence (pokud BE posílá)
  const seq = useMemo(() => {
    const s = game?.winningSequence || game?.game?.winningSequence || null;
    return Array.isArray(s) && s.length ? s : null;
  }, [game?.winningSequence, game?.game?.winningSequence]);

  // Statistiky
  const moves = Number.isFinite(game?.moves)
    ? Number(game.moves)
    : Array.isArray(game?.history)
    ? game.history.length
    : null;
  const hintsUsed = Number.isFinite(game?.hintsUsed)
    ? Number(game.hintsUsed)
    : Number.isFinite(game?.hints_used)
    ? Number(game?.hints_used)
    : 0;

  // Breakpoint – stacked < 980 px
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 980px)');
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // ===== Timer =====
  const boardSig = useMemo(
    () => (board ? board.flat().join('') : ''),
    [board]
  );

  // robustní načtení délky tahu (sekundy) z více možných polí + fallback na sessionStorage
  const configuredSec = useMemo(() => {
    const candidates = [
      game?.turnTimerSec,
      game?.turn_timer_sec,
      game?.timerSec,
      game?.settings?.turnTimerSec,
      game?.settings?.timerSec,
      game?.settings?.timer?.seconds,
    ];
    for (const v of candidates) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
    try {
      const raw = sessionStorage.getItem('ttt.settings');
      if (raw) {
        const cfg = JSON.parse(raw);
        const enabled = !!cfg?.timer?.enabled;
        const secs = Number(cfg?.timer?.seconds);
        if (enabled && Number.isFinite(secs) && secs > 0) return secs;
      }
    } catch {}
    return 0;
  }, [
    game?.turnTimerSec,
    game?.turn_timer_sec,
    game?.timerSec,
    game?.settings?.turnTimerSec,
    game?.settings?.timerSec,
    game?.settings?.timer?.seconds,
  ]);

  // živý countdown v prohlížeči + jednorázové onExpire
  function useTurnCountdown({ resetKey, initialSeconds, running, onExpire }) {
    const [sec, setSec] = useState(() => Number(initialSeconds) || 0);

    const deadlineRef = useRef(null);
    const tickIdRef = useRef(null);
    const firedRef = useRef(false);

    // drž onExpire bez spouštění resetu
    const onExpireRef = useRef(onExpire);
    useEffect(() => {
      onExpireRef.current = onExpire;
    }, [onExpire]);

    // drž si poslední známý zbývající čas mezi pauzami
    const secRef = useRef(sec);
    useEffect(() => {
      secRef.current = sec;
    }, [sec]);

    const clearTick = () => {
      if (tickIdRef.current) {
        clearInterval(tickIdRef.current);
        tickIdRef.current = null;
      }
    };

    const startIntervalFrom = (startSeconds) => {
      if (!Number.isFinite(startSeconds) || startSeconds <= 0) return;
      deadlineRef.current = Date.now() + startSeconds * 1000;

      const tick = () => {
        const leftMs = Math.max(0, (deadlineRef.current ?? 0) - Date.now());
        const leftSec = Math.ceil(leftMs / 1000);
        if (leftSec !== secRef.current) setSec(leftSec);

        if (leftSec <= 0 && !firedRef.current) {
          firedRef.current = true;
          clearTick();
          if (typeof onExpireRef.current === 'function') onExpireRef.current();
        }
      };

      tick();
      tickIdRef.current = setInterval(tick, 250);
    };

    // RESET jen když se změní deska/tah nebo se změní délka tahu
    useEffect(() => {
      const start = Number(initialSeconds) || 0;
      firedRef.current = false;
      clearTick();
      setSec(start);
      if (!running || start <= 0) return;
      startIntervalFrom(start);

      return clearTick;
    }, [resetKey, initialSeconds, running]);

    // Pauza/rezum: pokračuj z aktuálně zbývajícího času
    useEffect(() => {
      clearTick();
      if (!running) return;

      const start = Number(secRef.current) || 0;
      if (start > 0) startIntervalFrom(start);

      return clearTick;
    }, [running]);

    const mm = String(Math.floor((Number(sec) || 0) / 60)).padStart(2, '0');
    const ss = String((Number(sec) || 0) % 60).padStart(2, '0');
    return { sec: Number(sec) || 0, label: `${mm}:${ss}` };
  }

  const onTimerExpired = useCallback(async () => {
    if (!game || ended || paused) return;
    try {
      if (typeof timeoutLose === 'function') {
        await timeoutLose();
      } else if (ttt?.timeoutLose && game?.id) {
        await ttt.timeoutLose({ gameId: game.id });
      } else if (typeof endAsTimeout === 'function') {
        endAsTimeout();
      } else {
        console.warn(
          '[GamePage] Timer expired, but no timeout handler available.'
        );
      }
    } catch (e) {
      console.warn('[GamePage] onTimerExpired ×', e);
    }
  }, [game, ended, paused, timeoutLose, endAsTimeout]);

  const resetKey = `${boardSig}#${game?.player ?? ''}#${game?.id ?? ''}`;

  const time = useTurnCountdown({
    resetKey,
    initialSeconds: configuredSec,
    running: !!game && !paused && configuredSec > 0 && !ended,
    onExpire: onTimerExpired,
  });

  const timeDisplay = configuredSec > 0 ? time.label : '—';
  const secondsLeft = configuredSec > 0 ? time.sec : null;

  // ===== Rozměry =====
  const headerRef = useRef(null);
  const shellRef = useRef(null);
  const rightRef = useRef(null);
  const toolbarRef = useRef(null);
  const statsRef = useRef(null);
  const boardRef = useRef(null);

  const HEADER_MIN_REM = 7.0;
  const EXTRA_TOP_PX = 8;
  const UNDER_PADDING_PX = 12;
  const SAFE_TOOLBAR_PX = 160;

  const [headerPx, setHeaderPx] = useState(0);
  useLayoutEffect(() => {
    const recalcHeader = () => {
      const measured = headerRef.current?.getBoundingClientRect().height || 0;
      setHeaderPx(Math.round(measured));
    };
    recalcHeader();

    const ro = new ResizeObserver(recalcHeader);
    if (headerRef.current) ro.observe(headerRef.current);
    window.addEventListener('resize', recalcHeader);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recalcHeader);
    };
  }, []);

  const [boardPx, setBoardPx] = useState(0);
  const [panelMaxPx, setPanelMaxPx] = useState(0);
  const toolbarHRef = useRef(SAFE_TOOLBAR_PX);

  useLayoutEffect(() => {
    let raf1 = 0,
      raf2 = 0,
      rafSpin = 0;
    let roRight, roToolbar, roShell;

    const recompute = () => {
      const rightW = rightRef.current?.getBoundingClientRect().width || 0;
      const viewportH = window.innerHeight;

      const measuredTb =
        toolbarRef.current?.getBoundingClientRect().height || 0;
      const tbH = Math.max(SAFE_TOOLBAR_PX, measuredTb);
      toolbarHRef.current = tbH;

      const root =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const baselinePx = HEADER_MIN_REM * root + EXTRA_TOP_PX;
      const headerTopPx = Math.max(headerPx, baselinePx);

      const containerH = Math.max(0, viewportH - headerTopPx - UNDER_PADDING_PX);
      setPanelMaxPx(Math.floor(containerH));

      const GAP = 12;
      const availableH = Math.max(0, containerH - tbH - GAP);

      const px = Math.max(0, Math.min(rightW, availableH));
      setBoardPx((prev) => (px > 0 ? Math.floor(px) : prev));
    };

    const spinUntilNonZero = (tries = 0) => {
      recompute();
      const w = rightRef.current?.getBoundingClientRect().width || 0;
      const ok = w > 0 && toolbarHRef.current > 0;
      if (!ok && tries < 10) {
        rafSpin = requestAnimationFrame(() => spinUntilNonZero(tries + 1));
      }
    };

    recompute();
    raf1 = requestAnimationFrame(recompute);
    raf2 = requestAnimationFrame(() => setTimeout(recompute, 0));
    spinUntilNonZero();

    roRight = new ResizeObserver(recompute);
    roToolbar = new ResizeObserver(recompute);
    roShell = new ResizeObserver(recompute);
    if (rightRef.current) roRight.observe(rightRef.current);
    if (toolbarRef.current) roToolbar.observe(toolbarRef.current);
    if (shellRef.current) roShell.observe(shellRef.current);

    window.addEventListener('resize', recompute);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        try {
          recompute();
        } catch {}
      });
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      cancelAnimationFrame(rafSpin);
      roRight?.disconnect();
      roToolbar?.disconnect();
      roShell?.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [narrow, headerPx, game?.id, game?.size, boardSig]);

  // ===== Best move =====
  const [bestOpen, setBestOpen] = useState(false);
  const [bestState, setBestState] = useState({
    loading: false,
    move: null,
    explain: '',
    explainRich: null,
    stats: null,
    analysis: null,
  });
  const [bestHintHidden, setBestHintHidden] = useState(false);

  const onBestMoveClick = async () => {
    setBestHintHidden(false);
    setBestOpen(true);
    setBestState({
      loading: true,
      move: null,
      explain: '',
      explainRich: null,
      stats: null,
      analysis: null,
    });
    try {
      let r = null;
      if (typeof bestMove === 'function') r = await bestMove();
      if (!r && game?.id) {
        try {
          r = await ttt.bestMoveHard({ gameId: game.id });
        } catch (_) {}
      }
      const move = r && Array.isArray(r.move) ? r.move : null;
      const explain = r?.explain || r?.meta || '';
      const explainRich = r?.explainRich ?? null;
      const stats = r?.stats ?? null;
      const analysis = r?.analysis ?? null;

      setBestState({ loading: false, move, explain, explainRich, stats, analysis });
    } catch {
      setBestState({
        loading: false,
        move: null,
        explain: 'Could not calculate best move.',
        explainRich: null,
        stats: null,
        analysis: null,
      });
    }
  };

  const handleCloseOverlay = () => {
    setBestOpen(false);
    setBestHintHidden(true);
  };

  const onCell = (r, c) => {
    if (!paused && !loading && !ended && game) {
      setBestOpen(false);
      setBestHintHidden(true);
      play({ row: r, col: c });
    }
  };

  const prevSigRef = useRef(boardSig);
  useEffect(() => {
    if (!prevSigRef.current) {
      prevSigRef.current = boardSig;
      return;
    }
    if (boardSig && boardSig !== prevSigRef.current) {
      setBestOpen(false);
      setBestHintHidden(true);
    }
    prevSigRef.current = boardSig;
  }, [boardSig]);

  function TurnGlyph({ who = 'X' }) {
    if (String(who).toUpperCase() === 'O') {
      return (
        <svg
          width="clamp(22px, 2.2vw, 28px)"
          height="clamp(22px, 2.2vw, 28px)"
          viewBox="0 0 64 64"
          aria-label="O turn"
        >
          <circle cx="32" cy="32" r="20" stroke="#38BDF8" strokeWidth="8" fill="none" />
        </svg>
      );
    }
    return (
      <svg
        width="clamp(22px, 2.2vw, 28px)"
        height="clamp(22px, 2.2vw, 28px)"
        viewBox="0 0 64 64"
        aria-label="X turn"
      >
        <line
          x1="10"
          y1="10"
          x2="54"
          y2="54"
          stroke="#FF6B6B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <line
          x1="54"
          y1="10"
          x2="10"
          y2="54"
          stroke="#FF6B6B"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // ===== Styly =====
  const page = {
    background:
      'linear-gradient(180deg, #0F172A 0%, #020617 20%, #020617 60%, #0F172A 100%)',
    minHeight: '100svh',
    overflowX: 'hidden',
    overflowY: 'auto',
  };

  const shell = {
    boxSizing: 'border-box',
    width: 'min(1280px, 96vw)',
    margin: '0 auto',
    paddingInline: 'clamp(12px, 3vw, 24px)',
    display: 'grid',
    gridTemplateColumns: narrow
      ? '1fr'
      : 'minmax(280px, 36%) minmax(0, 1fr)',
    columnGap: narrow ? 0 : 'clamp(16px, 4vw, 72px)',
    rowGap: 'clamp(16px, 4vw, 32px)',
    alignItems: 'start',
    position: 'relative',
  };

  const rightColInner = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  };

  const boardWrap = {
    width: boardPx > 0 ? `${boardPx}px` : 'min(60vw, 60vh)',
    height: boardPx > 0 ? `${boardPx}px` : 'min(60vw, 60vh)',
    position: 'relative',
    filter: 'drop-shadow(-2px 3px 4px #CBD5E1)',
    zIndex: 2,
  };

  const toolbarOuter = {
    width: boardPx > 0 ? `${boardPx}px` : 'min(60vw, 60vh)',
    marginTop: 12,
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 3,
  };

  const toolbarInner = { width: '100%', position: 'relative' };
  const toolbarWrap = { position: 'relative', zIndex: 3 };

  const leftPausedOverlay = paused
    ? {
        position: 'absolute',
        inset: 0,
        borderRadius: 'clamp(20px, 3vw, 40px)',
        background: 'rgba(2, 6, 23, 0.55)',
        backdropFilter: 'blur(1px)',
        zIndex: 2,
        pointerEvents: 'none',
      }
    : null;

  const rightPausedOverlay = paused
    ? {
        position: 'absolute',
        inset: 0,
        borderRadius: 0,
        background: 'rgba(2, 6, 23, 0.55)',
        backdropFilter: 'blur(1px)',
        zIndex: 1,
        pointerEvents: 'none',
      }
    : null;

  // Hint pozice & text
  const bestMovePos = bestState.move ?? hint?.move ?? null;
  const bestExplain =
    bestState.explain || hint?.explain || hint?.analysis?.explain || '';

  // ====== LOADING SKELETON ======
  const notReady = !game || !board || !size;

  if (notReady) {
    return (
      <div style={page}>
        <div ref={headerRef}>
          <Header
            showBack={false}
            onNavigate={(arg) =>
              arg === 'back' ? navigate('/') : navigate(String(arg || '/'))
            }
          />
        </div>
        <UnderHeader
          headerRef={headerRef}
          center
          minRem={HEADER_MIN_REM}
          extraTopPx={EXTRA_TOP_PX}
          scrollY="hidden"
        >
          <div
            style={{
              ...shell,
              alignItems: 'center',
              justifyItems: 'center',
              height: '60vh',
              color: '#CBD5E1',
            }}
          >
            Loading game…
          </div>
        </UnderHeader>
      </div>
    );
  }

  // ====== Výběr levého panelu podle stavu ======
  const LeftPanel = (() => {
    if (status === 'timeout') return TimeRanOutPanel;
    if (status === 'draw') return DrawInfoPanel;
    if (status === 'win') {
      if (String(mode).toLowerCase() === 'pve') {
        return isHumanWinner ? WinInfoPanel : LoseInfoPanel;
      }
      return PvPInfoPanel;
    }
    return GameInfoPanel;
  })();

  // ====== READY UI ======
  return (
    <div style={page}>
      <div ref={headerRef}>
        <Header
          showBack={false}
          onNavigate={(arg) =>
            arg === 'back' ? navigate('/') : navigate(String(arg || '/'))
          }
        />
      </div>

      <UnderHeader
        headerRef={headerRef}
        center
        minRem={HEADER_MIN_REM}
        extraTopPx={EXTRA_TOP_PX}
        scrollY={narrow ? 'auto' : 'hidden'}
      >
        <div style={shell} ref={shellRef}>
          {/* levý panel – nikdy nepřeteče */}
          <div
            ref={statsRef}
            style={{ position: 'relative', maxHeight: `${panelMaxPx}px` }}
          >
            <LeftPanel
              players={players}
              mode={mode}
              kToWin={kToWin}
              size={size}
              timeDisplay={configuredSec > 0 ? time.label : '—'}
              secondsLeft={configuredSec > 0 ? time.sec : null}
              turnTimerTotalSec={configuredSec || null}
              maxHeightPx={panelMaxPx}
              TurnGlyph={TurnGlyph}
              player={game?.player || 'X'}
              difficulty={difficulty}
              winner={winner}
              moves={moves}
              hintsUsed={hintsUsed}
              key={`${status}:${winner ?? ''}:${game?.id ?? ''}`}
            />
            {leftPausedOverlay && (
              <div style={leftPausedOverlay} aria-hidden="true" />
            )}
          </div>

          {/* pravý sloupec – board + toolbar */}
          <div ref={rightRef} style={rightColInner}>
            {rightPausedOverlay && (
              <div style={rightPausedOverlay} aria-hidden="true" />
            )}

            <div ref={boardRef} style={boardWrap}>
              <Board
                key={`${game?.id || 'nogame'}:${size || 'n'}:${boardSig}`}
                board={board}
                size={size}
                disabled={paused || loading || ended}
                pendingMove={pendingMove}
                winnerLine={seq} // [{row,col}, ...] (nebo [[r,c], ...])
                winnerMark={winner} // 'X' | 'O' (barva čáry)
                showStrike={status === 'win'}
                onCell={onCell}
              />
              <BestMoveHint
                containerRef={boardRef}
                size={size}
                move={bestMovePos}
                show={
                  !!bestMovePos &&
                  !bestHintHidden &&
                  status !== 'win' &&
                  !ended
                }
                cellInset={2}
              />
            </div>

            <div style={toolbarOuter}>
              <div ref={toolbarRef} style={toolbarInner}>
                <div style={toolbarWrap} data-toolbar>
                  {ended ? (
                    <AfterGameToolbar
                      onPlayAgain={restart}
                      onNewGame={() => navigate('/tic_tac_toe/settings')}
                      onStrategy={() => navigate('/about')}
                    />
                  ) : (
                    <Toolbar
                      paused={paused}
                      onBestMove={onBestMoveClick}
                      onRestart={restart}
                      onPause={() => setPaused((p) => !p)}
                      onPower={() => navigate('/')}
                      onStrategy={() => navigate('/about')}
                      bestMoveActive={bestOpen && !ended}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </UnderHeader>

      <BestMoveOverlay
        open={bestOpen && !ended}
        onClose={handleCloseOverlay}
        anchorRef={statsRef}
        move={bestMovePos}
        explain={bestExplain}
        explainRich={bestState.explainRich ?? hint?.explainRich ?? null}
        stats={bestState.stats ?? hint?.stats ?? null}
        analysis={bestState.analysis ?? hint?.analysis ?? null}
        loading={bestState.loading}
      />
    </div>
  );
}
