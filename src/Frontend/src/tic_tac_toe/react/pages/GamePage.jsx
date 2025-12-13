/**
 * @file    GamePage.jsx
 * @brief   Main Tic-Tac-Toe game screen – board, toolbars, info panels, timer,
 *          and spectator.
 *
 * This component renders the primary play view for both standard games and
 * spectator mode. It shows the board, the current game status, context
 * information panels, and action toolbars (before/after the game).
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-13
 */

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

import Toolbar from '../components/toolbar/toolbar.jsx';
import AfterGameToolbar from '../components/toolbar/afterGameToolbar.jsx';

import Board from '../components/board.jsx';
import BestMoveHint from '../components/best_move/bestMoveHint.jsx';
import BestMoveOverlay from '../components/best_move/bestMoveOverlay.jsx';
import UnderHeader from '../components/underHeader.jsx';
import GameInfoPanel from '../components/infoPanels/gameInfoPanel.jsx';
import WinInfoPanel from '../components/infoPanels/winInfoPanel.jsx';
import LoseInfoPanel from '../components/infoPanels/loseInfoPanel.jsx';
import DrawInfoPanel from '../components/infoPanels/drawInfoPanel.jsx';
import PvPInfoPanel from '../components/infoPanels/pvpInfoPanel.jsx';
import XWinsInfoPanel from '../components/infoPanels/xWinInfoPanel.jsx';
import OWinsInfoPanel from '../components/infoPanels/oWinInfoPanel.jsx';
import TimeRanOutPanel from '../components/infoPanels/timeRanOutPanel.jsx';
import SpectatorInfoPanel from '../components/infoPanels/spectatorInfoPanel.jsx';
import MarkX from '../components/marks/markX.jsx';
import MarkO from '../components/marks/markO.jsx';
import { useGame } from '../hooks/gameContext.js';
import { ttt } from '../../javascript/ttt.client.js';
import styles from '../../../Styles';
import colors from '../../../Colors';

export default function GamePage() {
    const navigate = useNavigate();

    /**
     * Core game state pulled from shared context.
     * - game:     latest game DTO from the backend
     * - loading:  active network interaction (/new, /play, /best-move, /restart, ...)
     * - pendingMove: optimistic move marker (used for ghost mark on the board)
     * - bestMove:  hook-level helper for /best-move (HARD) requests
     * - restart:   reset current game on backend while keeping settings
     * - play:      send a single move to the backend
     * - mode:      'pvp' | 'pve' (current game mode)
     * - players:   client-side projection of player nicknames
     * - hint:      last best-move result from backend (if any)
     * - timeoutLose / endAsTimeout: timeout handling (backend + safe FE fallback)
     * - isSpectator / spectator / spectatorPlayAgain: AI vs AI spectator mode API
     */
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
        timeoutLose,   // backend timeout handler
        endAsTimeout,  // frontend-only timeout fallback
        isSpectator,
        spectator,
        spectatorPlayAgain,
    } = useGame();

    /**
     * Local UI-only pause flag.
     * When paused:
     *  - board is disabled
     *  - timer countdown stops
     *  - semi-transparent overlays are rendered over left + right column
     * The backend game state continues to exist unchanged.
     */
    const [paused, setPaused] = useState(false);

    // ===== Derived values from DTO =====
    const size = Number.isFinite(Number(game?.size)) ? Number(game.size) : null;
    const kToWin = Number.isFinite(Number(game?.k_to_win)) ? Number(game.k_to_win) : null;
    const difficulty = game?.difficulty ?? null;

    const board = Array.isArray(game?.board) ? game.board : null;

    // Result / status derived from
    const winner = game?.winner ?? null;
    const rawStatus = game?.status ?? 'running';
    const status = String(rawStatus).toLowerCase(); // 'running' | 'win' | 'draw' | 'timeout' | 'forfeit'...
    const ended = ['win', 'draw', 'timeout', 'forfeit'].includes(status);

    /**
     * Human player mark (X/O) for PvE mode.
     */
    const humanMark = (() => {
        const hm = game?.humanMark;
        return hm ? String(hm).toUpperCase() : null;
    })();
    const isHumanWinner =
            ended && humanMark && String(winner).toUpperCase() === humanMark;

    /**
     * Winning sequence, if provided by backend.
     * It is forwarded into <Board /> so it can draw the strike-through line.
     */
    const seq = useMemo(() => {
        const s = game?.winningSequence ?? null;
        return Array.isArray(s) && s.length ? s : null;
    }, [game?.winningSequence]);

    // Basic counters for statistics on the left panel
    const moves = Number.isFinite(Number(game?.moves)) ? Number(game.moves) : null;
    const hintsUsed = Number.isFinite(Number(game?.hintsUsed)) ? Number(game.hintsUsed) : 0;

    // Layout breakpoint
    const [narrow, setNarrow] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 980px)');
        const onChange = () => setNarrow(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // ===== Timer =====

    /**
     * Signature of the board (string) used to detect when the position changes.
     */
    const boardSig = useMemo(
            () => (board ? board.flat().join('') : ''),
            [board],
    );

    /**
     * Reads turn duration (seconds) from DTO.
     * In spectator mode the local timer is always disabled
     */
    const configuredSec = useMemo(() => {
        if (isSpectator) return 0;

        const n = Number(game?.turnTimerSec);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }, [isSpectator, game?.turnTimerSec]);

    /**
     * Local per-turn countdown hook.
     *
     * @param {Object} params
     * @param {string} params.resetKey
     *        Unique key for the current turn (e.g. board signature + player).
     *        Any change means "new turn → restart countdown".
     * @param {number} params.initialSeconds
     *        Total time allocated for this turn (0 disables counting).
     * @param {boolean} params.running
     *        Whether the timer should tick or stay frozen (pause, game ended, etc.).
     * @param {Function} params.onExpire
     *        Callback called exactly once when the countdown reaches zero.
     * @returns {{sec: number, label: string}}
     *        Current remaining seconds and formatted "MM:SS" label.
     */
    function useTurnCountdown({ resetKey, initialSeconds, running, onExpire }) {
        const [sec, setSec] = useState(() => Number(initialSeconds) || 0);

        const deadlineRef = useRef(null);
        const tickIdRef = useRef(null);
        const firedRef = useRef(false);

        const onExpireRef = useRef(onExpire);
        useEffect(() => {
            onExpireRef.current = onExpire;
        }, [onExpire]);

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

        /**
         * Start ticking from given remaining seconds.
         */
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

        // Full reset
        useEffect(() => {
            const start = Number(initialSeconds) || 0;
            firedRef.current = false;
            clearTick();
            setSec(start);
            if (!running || start <= 0) return;
            startIntervalFrom(start);

            return clearTick;
        }, [resetKey, initialSeconds, running]);

        // Pause/resume using the last known remaining time
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

    /**
     * Timer-expired handler.
     */
    const onTimerExpired = useCallback(async () => {
        if (!game || ended || paused || isSpectator) return;
        try {
            if (typeof timeoutLose === 'function') {
                await timeoutLose();
            } else if (ttt?.timeoutLose && game?.id) {
                await ttt.timeoutLose({ gameId: game.id });
            } else if (typeof endAsTimeout === 'function') {
                endAsTimeout();
            } else {
                console.warn(
                        '[GamePage] Timer expired, but no timeout handler is available.',
                );
            }
        } catch (e) {
            console.warn('[GamePage] onTimerExpired ×', e);
        }
    }, [isSpectator, game, ended, paused, timeoutLose, endAsTimeout]);


    const resetKey = `${boardSig}#${game?.player ?? ''}#${game?.id ?? ''}`;

    const time = useTurnCountdown({
        resetKey,
        initialSeconds: configuredSec,
        running:
                !!game &&
                !paused &&
                configuredSec > 0 &&
                !isSpectator &&
                !ended,
        onExpire: onTimerExpired,
    });

    // ===== Layout measurements =====
    const headerRef = useRef(null);
    const shellRef = useRef(null);
    const rightRef = useRef(null);
    const toolbarRef = useRef(null);
    const statsRef = useRef(null);
    const boardRef = useRef(null);

    const HEADER_MIN_REM = 5.0;
    const EXTRA_TOP_PX = 8;
    const UNDER_PADDING_PX = 12;
    const SAFE_TOOLBAR_PX = 160;

    /**
     * headerPx tracks the actual rendered height of the header
     */
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

    /**
     * Layout recalculation:
     *  - Measures available vertical space under the header.
     *  - Reserves room for the toolbar.
     *  - Sets:
     *      boardPx      = size of the square game board (px).
     *      panelMaxPx   = maximum height for the left info panel.
     */
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
            setBoardPx((prev) => {
                const next = Number.isFinite(px) ? Math.floor(px) : 0;
                return next >= 0 ? next : prev;
            });
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

    // ===== Best move overlay / hint =====

    /**
     * bestOpen / bestState / bestHintHidden control the functionality:
     *  - bestOpen: whether the big overlay dialog is visible
     *  - bestState: last explicit request via the button in the toolbar
     *  - bestHintHidden: once the user makes a move, hint bubble hides until next request
     */
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

    /**
     * Handle "Best move" button click.
     */
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

    // Close overlay
    const handleCloseOverlay = () => {
        setBestOpen(false);
        setBestHintHidden(true);
    };

    /**
     * onCell is the only handler for user clicks on the board:
     *  - respects pause/loading/ended flags
     *  - clears any currently open hint overlay
     *  - delegates to useGame().play(...) which calls backend
     */
    const onCell = (r, c) => {
        if (!paused && !loading && !ended && game) {
            setBestOpen(false);
            setBestHintHidden(true);
            play({ row: r, col: c });
        }
    };

    /**
     * Whenever the board signature changes, all previous hints are invalid.
     */
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

    /**
     * Small SVG glyph to show whose turn it is.
     */
    function TurnGlyph({ who = 'X' }) {
        const isO = String(who).toUpperCase() === 'O';
        const size = 'clamp(22px, 2.2vw, 28px)';
        const commonStyle = { width: size, height: size, display: 'block' };

        return isO ? (
                <MarkO style={commonStyle} />
        ) : (
                <MarkX style={commonStyle} />
        );
    }

    // ===== Styles =====
    const page = {
        background: styles.container.background,
        minHeight: '100svh',
        width: '100%',
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
        maxWidth: '100%',
        maxHeight: '100%',
        marginInline: 'auto',
        position: 'relative',
        filter: `drop-shadow(-2px 3px 4px ${colors.text})`,
        zIndex: 2,
    };

    const toolbarOuter = {
        width: boardPx > 0 ? `${boardPx}px` : 'min(60vw, 60vh)',
        maxWidth: '100%',
        marginTop: 12,
        marginInline: 'auto',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 3,
    };

    const toolbarInner = { width: '100%', position: 'relative' };
    const toolbarWrap = { position: 'relative', zIndex: 3 };

    /**
     * Semi-transparent overlays used to visually indicate a paused game.
     */
    const rgba_from_hex = (hex, a) => {
        const h = String(hex || '').replace('#', '');
        if (h.length !== 6) return `rgba(0,0,0,${a})`;
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    };

    const paused_bg = rgba_from_hex(colors.primary, 0.55);

    const leftPausedOverlay = paused
            ? {
                position: 'absolute',
                inset: 0,
                borderRadius: 'clamp(20px, 3vw, 40px)',
                background: paused_bg,
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
                background: paused_bg,
                backdropFilter: 'blur(1px)',
                zIndex: 1,
                pointerEvents: 'none',
            }
            : null;

    // Hint position & text
    const bestMovePos = bestState.move ?? hint?.move ?? null;
    const bestExplain =
            bestState.explain || hint?.explain || hint?.analysis?.explain || '';

    // ===== Loading skeleton =====
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
                            center={!narrow}
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
                                    color: colors.text,
                                }}
                        >
                            Loading game…
                        </div>
                    </UnderHeader>
                </div>
        );
    }

    // ===== Left panel selection based on status =====
    /**
     * LeftPanel is chosen dynamically according to game status and mode:
     *  - timeout - TimeRanOutPanel
     *  - draw    - DrawInfoPanel
     *  - win:
     *      * spectator: XWinsInfoPanel / OWinsInfoPanel
     *      * PvE: WinInfoPanel (human) / LoseInfoPanel (bot)
     *      * PvP: PvPInfoPanel
     *  - running + spectator: SpectatorInfoPanel
     *  - running + normal:   GameInfoPanel
     */
    const LeftPanel = (() => {
        // Result panels have priority even in spectator mode
        if (status === 'timeout') return TimeRanOutPanel;
        if (status === 'draw') return DrawInfoPanel;
        if (status === 'win') {
            if (isSpectator) {
                if (winner === 'X') return XWinsInfoPanel;
                if (winner === 'O') return OWinsInfoPanel;
            }
            if (String(mode).toLowerCase() === 'pve') {
                return isHumanWinner ? WinInfoPanel : LoseInfoPanel;
            }
            return PvPInfoPanel;
        }

        // Running or other states
        if (isSpectator) return SpectatorInfoPanel;
        return GameInfoPanel;
    })();

    // ===== Main UI =====
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
                        {/* Left panel – info / result */}
                        <div
                                ref={statsRef}
                                style={{
                                    position: 'relative',
                                    maxHeight: `${panelMaxPx}px`,
                                    width: '100%',
                                    minWidth: 0,
                                }}
                        >
                            <LeftPanel
                                    players={players}
                                    mode={mode}
                                    kToWin={kToWin}
                                    size={size}
                                    status={status}
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
                                    // Spectator-only
                                    lastMove={spectator?.lastMove}
                                    explain={spectator?.explain}
                                    explainRich={spectator?.explainRich}
                                    stats={spectator?.stats}
                            />
                            {leftPausedOverlay && (
                                    <div style={leftPausedOverlay} aria-hidden="true" />
                            )}
                        </div>

                        {/* Right column – board + toolbar */}
                        <div
                                ref={rightRef}
                                style={{
                                    ...rightColInner,
                                    width: '100%',
                                    minWidth: 0,
                                }}
                        >
                            {rightPausedOverlay && (
                                    <div style={rightPausedOverlay} aria-hidden="true" />
                            )}

                            <div ref={boardRef} style={boardWrap}>
                                <Board
                                        key={`${game?.id || 'nogame'}:${size || 'n'}:${boardSig}`}
                                        board={board}
                                        size={size}
                                        disabled={isSpectator || paused || loading || ended}
                                        pendingMove={pendingMove}
                                        winnerLine={seq}
                                        winnerMark={winner}
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
                                                        onPlayAgain={isSpectator ? spectatorPlayAgain : restart}
                                                        onNewGame={() => navigate('/tic-tac-toe/settings')}
                                                        onStrategy={() => navigate('/tic-tac-toe/strategy')}
                                                        onBack={() => navigate('/')}
                                                />
                                        ) : (
                                                <Toolbar
                                                        paused={paused}
                                                        onBestMove={isSpectator ? undefined : onBestMoveClick}
                                                        onRestart={restart}
                                                        onPause={() => setPaused((p) => !p)}
                                                        onPower={() => navigate('/')}
                                                        onStrategy={() => navigate('/tic-tac-toe/strategy')}
                                                        bestMoveActive={!isSpectator && bestOpen && !ended}
                                                        onSettings={() => navigate('/tic-tac-toe/settings')}
                                                        isSpectator={isSpectator}
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
