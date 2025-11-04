import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import colors from '../Colors';
import Header from '../components/Header';
import PanelCard from '../components/PanelCard';
import Slider from '../components/Slider';
import NumberField from '../components/NumberField';
import MineGrid from '../components/minesweeper/MineGrid';

const formatTime = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const ActionPill = ({ children, onClick, disabled }) => {
    const style = {
        padding: '10px 18px',
        borderRadius: 14,
        background: disabled ? 'rgba(100,100,100,0.18)' : 'rgba(148,163,184,0.18)',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
        color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        opacity: disabled ? 0.5 : 1,
    };
    return (
            <button style={style} onClick={onClick} type="button" disabled={disabled}>
                {children}
            </button>
    );
};

const BarBtn = ({ icon, label, disabled, onClick, active }) => {
    const btnStyle = {
        display: 'grid',
        placeItems: 'center',
        gap: 6,
        width: 90,
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'default' : 'pointer',
        color: colors.text_header,
        userSelect: 'none',
        filter: active ? 'drop-shadow(0 0 8px rgba(255,255,255,0.25))' : 'none',
    };
    const capStyle = { fontSize: 13, textAlign: 'center' };

    return (
            <div style={btnStyle} onClick={() => !disabled && onClick?.()}>
                <div>{icon}</div>
                <div style={capStyle}>{label}</div>
            </div>
    );
};

const IHint = (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 3a7 7 0 017 7c0 2.6-1.5 4.6-3.5 5.8V19a1 1 0 01-1 1h-5a1 1 0 01-1-1v-3.2A6.9 6.9 0 015 10a7 7 0 017-7z" stroke="white" />
            <path d="M9 22h6" stroke="white" />
        </svg>
);

const IPause = (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M7 4h4v16H7zM13 4h4v16h-4z" />
        </svg>
);

const IPlay = (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M8 5l12 7-12 7z" />
        </svg>
);

const IUndo = (
        <svg width="28" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M7 7l-4 4 4 4" stroke="white" />
            <path d="M3 11h10a5 5 0 110 10h-2" stroke="white" />
        </svg>
);

const IFlag = (
        <svg width="28" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M5 3v18" stroke="white" />
            <path d="M7 4h9l-2 4 2 4H7z" fill="white" />
        </svg>
);

const IDrag = (
        <svg width="28" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M4 10h16M4 14h16" stroke="white" />
            <circle cx="7" cy="7" r="1.5" fill="white" />
            <circle cx="7" cy="17" r="1.5" fill="white" />
        </svg>
);

export function MinesweeperGameView() {
    const {gameId} = useParams();
    const navigate = useNavigate();

    console.log('[GameView] Component mounted/updated', {gameId});

    useEffect(() => {
        if(!gameId) {
            console.warn('[GameView] No gameId found, redirecting to /minesweeper');
            navigate('/minesweeper', {replace: true});
        }
    }, [gameId, navigate]);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const base = `${apiUrl}/api/minesweeper`;
    console.log('[GameView] API base URL:', base);

    const [view, setView] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const lastRefreshRef = useRef(0);

    const uiPrefs = useMemo(() => {
        try {
            const raw = localStorage.getItem(`ms:uiPrefs:${gameId}`);
            console.log('[GameView] Loading UI preferences:', {gameId, raw});
            return JSON.parse(raw || '{}');
        }
        catch(e) {
            console.error('[GameView] Failed to parse UI preferences:', e);
            return {};
        }
    }, [gameId]);

    const showTimer = uiPrefs.showTimer ?? true;
    const allowUndo = uiPrefs.allowUndo ?? true;
    const enableHints = uiPrefs.enableHints ?? true;
    const holdHighlight = uiPrefs.holdHighlight ?? true;

    console.log('[GameView] UI preferences:', {showTimer, allowUndo, enableHints, holdHighlight});

    const [paused, setPaused] = useState(false);
    const [hintRect, setHintRect] = useState(null);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [seekIndex, setSeekIndex] = useState(0);
    const [quickFlag, setQuickFlag] = useState(false);
    const [highlightCell, setHighlightCell] = useState(null);

    // separátní stav pro timer — periodický tick mění jen toto, zbytek UI se nerenderuje z důvodu timeru
    const [timerSec, setTimerSec] = useState(0);

    const req = useCallback(async(path, init) => {
        const url = `${base}${path}`;
        console.log(`[API Request] ${init?.method || 'GET'} ${url}`, init?.body ? JSON.parse(init.body) : {});

        try {
            const res = await fetch(url, init);
            const data = await res.json().catch(() => ({}));

            if(!res.ok) {
                console.error(`[API Error] ${res.status}`, data);
                throw new Error(data?.error || `HTTP ${res.status}`);
            }

            console.log(`[API Success] ${init?.method || 'GET'} ${url}`, data);
            return data;
        }
        catch(e) {
            console.error(`[API Exception] ${init?.method || 'GET'} ${url}`, e);
            throw e;
        }
    }, []);

    const refresh = useCallback(async(force = false) => {
        if(!gameId) {
            console.warn('[Refresh] No gameId, skipping refresh');
            return;
        }

        const now = Date.now();
        if(!force && now - lastRefreshRef.current < 900) {
            console.log('[Refresh] Throttled (too soon)');
            return;
        }
        lastRefreshRef.current = now;

        console.log('[Refresh] Fetching game state', {gameId, force});

        const data = await req(`/game/${gameId}`, {method: 'GET'});

        setView(prev => {
            if(!prev) {
                console.log('[Refresh] Initial view loaded', data);
                return data;
            }

            const unchanged =
                    prev.cursor === data.cursor &&
                    prev.status === data.status &&
                    JSON.stringify(prev.board?.opened) === JSON.stringify(data.board?.opened) &&
                    JSON.stringify(prev.board?.flagged) === JSON.stringify(data.board?.flagged);

            if(unchanged) {
                console.log('[Refresh] View unchanged, keeping old state');
            }
            else {
                console.log('[Refresh] View updated', {
                    cursor: {old: prev.cursor, new: data.cursor},
                    status: {old: prev.status, new: data.status},
                    opened: {old: prev.board?.opened?.length, new: data.board?.opened?.length},
                    flagged: {old: prev.board?.flagged?.length, new: data.board?.flagged?.length},
                });
            }

            return unchanged ? prev : data;
        });

        // synchronizace timeru a seekIndex / quickFlag
        setQuickFlag(!!data.quickFlagEnabled);
        setSeekIndex(data.cursor ?? 0);
        setTimerSec(data.elapsedTime ?? 0);
        console.log('[Refresh] State updated', {quickFlag: data.quickFlagEnabled, seekIndex: data.cursor, timerSec: data.elapsedTime});
    }, [gameId, req]);

    useEffect(() => {
        console.log('[Effect] Initial refresh on mount');
        refresh(true).catch((e) => {
            console.error('[Effect] Initial refresh failed:', e);
            setError(String(e.message || e));
        });
    }, [refresh]);

    // Timer: jen tento efekt mění periodicky `timerSec` — zamezí zbytečným rerenderům jiných částí
    useEffect(() => {
        if(!showTimer || paused || !view || view.status !== 'playing') {
            console.log('[Timer] Stopped', {showTimer, paused, status: view?.status});
            return;
        }

        console.log('[Timer] Started');
        const timer = setInterval(() => {
            setTimerSec(prev => prev + 1);
        }, 1000);

        return () => {
            console.log('[Timer] Cleanup');
            clearInterval(timer);
        };
    }, [showTimer, paused, view?.status]);

    // If server updates view.elapsedTime (e.g. after undo/seek), keep local timer in sync
    useEffect(() => {
        if(view?.elapsedTime !== undefined) {
            setTimerSec(view.elapsedTime);
        }
    }, [view?.elapsedTime]);

    const flaggedCount = view?.board?.flagged?.length ?? 0;
    const minesRemaining = Math.max(0, (view?.mines ?? 0) - flaggedCount);

    const difficulty = useMemo(() => {
        try {
            const raw = localStorage.getItem('ms:lastCreate');
            if(!raw) return null;
            const cp = JSON.parse(raw);
            console.log('[Difficulty] Loaded:', cp.preset || 'Custom');
            return cp.preset || 'Custom';
        }
        catch(e) {
            console.error('[Difficulty] Parse error:', e);
            return null;
        }
    }, []);

    const hearts = useMemo(() => {
        const total = view?.lives?.total ?? 0;
        const left = view?.lives?.left ?? 0;
        console.log('[Hearts] Calculated:', {total, left});
        return Array.from({length: total}, (_, i) => i < left);
    }, [view?.lives?.total, view?.lives?.left]);

    const isOpened = useCallback((r, c) => {
        return view?.board?.opened?.some(cell => cell.r === r && cell.c === c);
    }, [view?.board?.opened]);

    // Interakční pravidla:
    const beforeStart = view?.status === 'new';
    const isOver = view?.status === 'lost' || view?.status === 'won';
    const canInteractCommon = !paused && !isOver && !busy;
    const canLeftClick = canInteractCommon; // levý klik (reveal) povolen i pokud hra ještě nezačala
    const canOtherActions = canInteractCommon && !beforeStart; // ostatní akce zakázat pokud beforeStart

    // reveal — levý klik (povoleno i před startem)
    const doReveal = useCallback(async(r, c) => {
        console.debug('[doReveal] called', { gameId, r, c, paused, cursor: view?.cursor });
        if(!view || paused || busy) {
            console.debug('[doReveal] skipped - no view/paused/busy', { viewExists: !!view, paused, busy });
            return;
        }
        const start = performance.now();
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/reveal`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({r, c}),
            });
            console.debug('[doReveal] response', { r, c, durationMs: Math.round(performance.now() - start), data });
            setView(data);
            setSeekIndex(data.cursor ?? 0);
            // sync timer immediately after action
            setTimerSec(data.elapsedTime ?? 0);
        }
        catch(e) {
            console.error('[doReveal] error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
            console.debug('[doReveal] finished', { r, c, totalMs: Math.round(performance.now() - start) });
        }
    }, [gameId, req, view, paused, busy]);

    // flag — zakázáno před startem
    const doFlag = useCallback(async(r, c, set) => {
        console.debug('[doFlag] called', { gameId, r, c, set, paused, cursor: view?.cursor });
        if(!view || paused || busy) {
            console.debug('[doFlag] skipped - no view/paused/busy', { viewExists: !!view, paused, busy });
            return;
        }
        if(beforeStart) {
            console.debug('[doFlag] skipped - game not started (flags disabled before first reveal)');
            return;
        }
        const start = performance.now();
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/flag`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({r, c, set}),
            });
            console.debug('[doFlag] response', { r, c, set, durationMs: Math.round(performance.now() - start), data });
            setView(data);
            setSeekIndex(data.cursor ?? 0);
            setTimerSec(data.elapsedTime ?? 0);
        }
        catch(e) {
            console.error('[doFlag] error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
            console.debug('[doFlag] finished', { r, c, set, totalMs: Math.round(performance.now() - start) });
        }
    }, [gameId, req, view, paused, busy, beforeStart]);

    const doMoveFlag = useCallback(async(fr, fc, tr, tc) => {
        console.debug('[doMoveFlag] called', { gameId, from: [fr, fc], to: [tr, tc], paused, cursor: view?.cursor });
        if(!view || paused || busy) {
            console.debug('[doMoveFlag] skipped - no view/paused/busy', { viewExists: !!view, paused, busy });
            return;
        }
        if(beforeStart) {
            console.debug('[doMoveFlag] skipped - game not started (move-flag disabled before first reveal)');
            return;
        }
        const start = performance.now();
        setBusy(true);
        setError(null);
        try {
            console.debug('[doMoveFlag] removing flag from', { fr, fc });
            await doFlag(fr, fc, false);
            console.debug('[doMoveFlag] placing flag to', { tr, tc });
            await doFlag(tr, tc, true);
            console.debug('[doMoveFlag] completed moves', { durationMs: Math.round(performance.now() - start) });
        }
        catch(e) {
            console.error('[doMoveFlag] error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
            console.debug('[doMoveFlag] finished', { from: [fr, fc], to: [tr, tc], totalMs: Math.round(performance.now() - start) });
        }
    }, [doFlag, view, paused, busy, beforeStart, gameId]);

    const toggleQuickFlag = useCallback(async() => {
        console.debug('[toggleQuickFlag] called', { gameId, currentQuickFlag: quickFlag });
        if(!view || paused || busy) {
            console.debug('[toggleQuickFlag] skipped - no view/paused/busy');
            return;
        }
        if(beforeStart) {
            console.debug('[toggleQuickFlag] skipped - cannot toggle quick-flag before first reveal');
            return;
        }
        const start = performance.now();
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/mode`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({quickFlag: !quickFlag}),
            });
            console.debug('[toggleQuickFlag] response', { durationMs: Math.round(performance.now() - start), data });
            setQuickFlag(!!data.quickFlagEnabled);
        }
        catch(e) {
            console.error('[toggleQuickFlag] error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
            console.debug('[toggleQuickFlag] finished', { previous: quickFlag, now: !quickFlag, totalMs: Math.round(performance.now() - start) });
        }
    }, [gameId, req, quickFlag, view, paused, busy, beforeStart]);

    const doUndo = useCallback(async() => {
        console.debug('[doUndo] called', { gameId, allowUndo, paused, cursor: view?.cursor });
        if(!allowUndo || !view || (view.cursor ?? 0) === 0 || paused || busy) {
            console.debug('[doUndo] skipped - not allowed/at start/paused/busy', { allowUndo, currentCursor: view?.cursor });
            return;
        }
        if(beforeStart) {
            console.debug('[doUndo] skipped - cannot undo before game started');
            return;
        }
        const start = performance.now();
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/undo`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({steps: 1}),
            });
            console.debug('[doUndo] response', { durationMs: Math.round(performance.now() - start), data });
            setView(data);
            setSeekIndex(data.cursor ?? 0);
            setTimerSec(data.elapsedTime ?? 0);
        }
        catch(e) {
            console.error('[doUndo] error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
            console.debug('[doUndo] finished', { totalMs: Math.round(performance.now() - start) });
        }
    }, [gameId, req, view, paused, busy, allowUndo, beforeStart]);

    const doHint = useCallback(async() => {
        console.debug('[doHint] called', { gameId, enableHints, paused, cursor: view?.cursor });
        if(!enableHints || !view || paused || busy) {
            console.debug('[doHint] skipped - disabled/no view/paused/busy', { enableHints, viewExists: !!view });
            return;
        }
        if(beforeStart) {
            console.debug('[doHint] skipped - cannot hint before first reveal');
            return;
        }
        const start = performance.now();
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/hint`, {method: 'GET'});
            console.debug('[doHint] response', { durationMs: Math.round(performance.now() - start), data });
            if(data?.type === 'mine-area') {
                setHintRect(data.rect);
                setHintsUsed(h => h + 1);
                setTimeout(() => setHintRect(null), 2500);
                console.debug('[doHint] revealed rect', { rect: data.rect });
            }
        }
        catch(e) {
            console.error('[doHint] error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
            console.debug('[doHint] finished', { totalMs: Math.round(performance.now() - start) });
        }
    }, [gameId, req, view, paused, busy, enableHints, beforeStart]);

    const doRevive = useCallback(async() => {
        console.debug('[doRevive] called', { gameId, seekIndex, paused });
        if(!view || paused || busy) {
            console.debug('[doRevive] skipped - no view/paused/busy');
            return;
        }
        if(beforeStart) {
            console.debug('[doRevive] skipped - cannot revive before game started');
            return;
        }
        const start = performance.now();
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/revive`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({toIndex: seekIndex}),
            });
            console.debug('[doRevive] response', { durationMs: Math.round(performance.now() - start), data });
            setView(data);
            setTimerSec(data.elapsedTime ?? 0);
        }
        catch(e) {
            console.error('[doRevive] error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
            console.debug('[doRevive] finished', { seekIndex, totalMs: Math.round(performance.now() - start) });
        }
    }, [gameId, req, seekIndex, paused, busy, beforeStart]);

    const handleBeginHold = useCallback((r, c) => {
        // Zadáno: zvýraznění osmiokolí jen pro odkrytou buňku — parent kontroluje
        if(holdHighlight && isOpened(r, c)) {
            console.log('[Hold] Begin highlight', {r, c});
            setHighlightCell({r, c});
        }
    }, [isOpened, holdHighlight]);

    const handleEndHold = useCallback(() => {
        console.log('[Hold] End highlight');
        setHighlightCell(null);
    }, []);

    const page = {
        minHeight: '100vh',
        width: '100%',
        background: `linear-gradient(to bottom, ${colors.secondary} 0%, ${colors.primary} 20%, ${colors.primary} 60%, ${colors.secondary} 100%)`,
        paddingTop: 72,
    };

    const shell = {
        maxWidth: 1200,
        margin: '0 auto',
        padding: 24,
        color: colors.text,
        display: 'grid',
        gridTemplateColumns: '360px 1fr',
        gap: 28,
        alignItems: 'start',
    };

    const boardWrap = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
    };

    if(!view) {
        console.log('[Render] Loading state');
        return (
                <div style={page}>
                    <Header showBack={true}
                            onNavigate={() => navigate(-1)}
                    />
                    <div style={{...shell, placeItems: 'center'}}>
                        <div style={{color: colors.text_header}}>Loading game…</div>
                    </div>
                </div>
        );
    }

    const isGameOver = view.status === 'lost' || view.status === 'won';
    // levý klik povolen i před startem
    const canInteractLeft = !paused && !isGameOver && !busy;
    const canInteractOthers = !paused && !isGameOver && !busy && view.status !== 'new';
    console.log('[Render] Game state', {status: view.status, isOver: isGameOver, canInteractLeft, canInteractOthers, paused, busy});

    return (
            <div style={page}>
                <Header showBack={true}
                        onNavigate={() => navigate(-1)}
                />

                <div style={shell}>
                    <PanelCard
                            title={isGameOver ? (view.status === 'won' ? 'Congratulations! 🎉' : 'Game Over 💀') : 'Game Info'}
                            style={{height: 'fit-content'}}
                    >
                        <div style={{display: 'grid', gap: 8, fontSize: 16}}>
                            <div>
                                <b>Difficulty:</b>
                                <span style={{float: 'right', color: colors.text_header}}>
                                {difficulty || 'Custom'}
                            </span>
                            </div>
                            <div>
                                <b>Map Size:</b>
                                <span style={{float: 'right', color: colors.text_header}}>
                                {view.rows}×{view.cols}
                            </span>
                            </div>
                            <div>
                                <b>Mines Remaining:</b>
                                <span style={{float: 'right', color: colors.text_header}}>
                                {minesRemaining}/{view.mines}
                            </span>
                            </div>
                            <div>
                                <b>Lives:</b>
                                <span style={{float: 'right', color: colors.text_header}}>
                                {view.lives?.total === 0 ? '∞' : `${view.lives?.left}/${view.lives?.total}`}
                            </span>
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: 8, marginTop: 14, marginBottom: 6, flexWrap: 'wrap'}}>
                            {hearts.slice(0, 15).map((full, i) => (
                                    <span key={i}
                                          style={{fontSize: 28}}
                                    >
                                {full ? '❤️' : '🖤'}
                            </span>
                            ))}
                            {hearts.length > 15 && (
                                    <span style={{fontSize: 18, alignSelf: 'center', color: colors.text_header}}>
                                +{hearts.length - 15}
                            </span>
                            )}
                        </div>

                        {showTimer && (
                                <div
                                        style={{
                                            textAlign: 'center',
                                            color: colors.text_header,
                                            fontSize: 28,
                                            fontWeight: 800,
                                            marginTop: 8,
                                        }}
                                >
                                    {formatTime(timerSec)}
                                </div>
                        )}

                        {isGameOver && (
                                <div style={{marginTop: 14, display: 'grid', gap: 6}}>
                                    <div>
                                        <b>Total Deaths:</b>
                                        <span style={{float: 'right', color: colors.text_header}}>
                                    {(view.lives?.total ?? 0) - (view.lives?.left ?? 0)}
                                </span>
                                    </div>
                                    <div>
                                        <b>Hints Used:</b>
                                        <span style={{float: 'right', color: colors.text_header}}>
                                    {hintsUsed}
                                </span>
                                    </div>
                                </div>
                        )}
                    </PanelCard>

                    <div style={boardWrap}>
                        <div
                                style={{
                                    padding: 8,
                                    borderRadius: 10,
                                    border: '1px solid rgba(255,255,255,0.45)',
                                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
                                }}
                        >
                            <div style={{opacity: paused ? 0.2 : 1, transition: 'opacity 120ms'}}>
                                <MineGrid
                                        rows={view.rows}
                                        cols={view.cols}
                                        opened={view.board.opened}
                                        flagged={view.board.flagged}
                                        lostOn={view.board?.lostOn}
                                        hintRect={hintRect}
                                        highlightCell={highlightCell}
                                        quickFlag={quickFlag}
                                        cellSize={28}
                                        gap={4}
                                        onReveal={(r, c) => canInteractLeft && doReveal(r, c)}
                                        onFlag={(r, c, set) => canInteractOthers && doFlag(r, c, set)}
                                        onMoveFlag={(fr, fc, tr, tc) => canInteractOthers && doMoveFlag(fr, fc, tr, tc)}
                                        onBeginHold={handleBeginHold}
                                        onEndHold={handleEndHold}
                                        holdHighlight={holdHighlight}
                                        mines={view.board.mines}
                                />
                            </div>
                        </div>

                        {!isGameOver ? (
                                <div
                                        style={{
                                            display: 'flex',
                                            gap: 18,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginTop: 6,
                                            flexWrap: 'wrap',
                                        }}
                                >
                                    <BarBtn
                                            icon={IHint}
                                            label="Hint"
                                            disabled={!enableHints || !canInteractOthers}
                                            onClick={doHint}
                                    />
                                    <BarBtn
                                            icon={paused ? IPlay : IPause}
                                            label={paused ? 'Resume' : 'Pause'}
                                            onClick={() => {
                                                console.log('[Pause] Toggling', {current: paused});
                                                setPaused((p) => !p);
                                            }}
                                    />
                                    <BarBtn
                                            icon={IUndo}
                                            label="Undo"
                                            disabled={!allowUndo || !canInteractOthers || (view.cursor ?? 0) === 0}
                                            onClick={doUndo}
                                    />
                                    <BarBtn
                                            icon={
                                                <div style={{display: 'grid', placeItems: 'center'}}>
                                                    {IFlag}
                                                    <div style={{fontSize: 10, marginTop: 2}}>
                                                        {quickFlag ? 'ON' : 'OFF'}
                                                    </div>
                                                </div>
                                            }
                                            label="Quick Flag"
                                            disabled={!canInteractOthers}
                                            onClick={toggleQuickFlag}
                                            active={quickFlag}
                                    />
                                    <BarBtn
                                            icon={IDrag}
                                            label="Drag Flag"
                                            disabled={!canInteractOthers}
                                            onClick={() => {}}
                                    />
                                </div>
                        ) : (
                                 <div
                                         style={{
                                             width: '100%',
                                             display: 'grid',
                                             gap: 12,
                                             justifyItems: 'center',
                                             marginTop: 6,
                                         }}
                                 >
                                     <div
                                             style={{
                                                 width: '82%',
                                                 display: 'flex',
                                                 alignItems: 'center',
                                                 gap: 10,
                                             }}
                                     >
                                <span style={{color: colors.text, fontWeight: 700, minWidth: 56}}>
                                    Move:
                                </span>
                                         <div style={{flex: 1}}>
                                             <Slider
                                                     min={0}
                                                     max={view.totalActions ?? 0}
                                                     value={seekIndex}
                                                     onChange={(v) => {
                                                         console.log('[Slider] Seek index changed', v);
                                                         setSeekIndex(v);
                                                     }}
                                             />
                                         </div>
                                         <NumberField
                                                 value={seekIndex}
                                                 onChange={(v) => {
                                                     console.log('[NumberField] Seek index changed', v);
                                                     setSeekIndex(v);
                                                 }}
                                                 min={0}
                                                 max={view.totalActions ?? 0}
                                         />
                                     </div>
                                     <div style={{display: 'flex', gap: 16}}>
                                         <ActionPill
                                                 onClick={doRevive}
                                                 disabled={busy}
                                         >
                                             Undo & Revive
                                         </ActionPill>
                                         <ActionPill
                                                 onClick={() => {
                                                     console.log('[NewGame] Navigating to /minesweeper');
                                                     navigate('/minesweeper');
                                                 }}
                                         >
                                             New Game
                                         </ActionPill>
                                     </div>
                                 </div>
                         )}

                        {error && (
                                <div style={{color: '#ff6b6b', fontWeight: 700, textAlign: 'center'}}>
                                    ⚠️ {error}
                                </div>
                        )}
                    </div>
                </div>
            </div>
    );
}
