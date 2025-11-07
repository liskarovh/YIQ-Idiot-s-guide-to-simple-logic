import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import colors from '../Colors';
import Header from '../components/Header';
import Box from '../components/Box';
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
        background: 'rgba(148,163,184,0.18)',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
        color: colors.text,
        fontWeight: 800,
        outline: 'none',
        cursor: 'pointer',
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

    console.log('[GameView] Component mounted', {gameId});

    useEffect(() => {
        if(!gameId) {
            console.warn('[GameView] No gameId, redirecting');
            navigate('/minesweeper', {replace: true});
        }
    }, [gameId, navigate]);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const base = `${apiUrl}/api/minesweeper`;

    const [view, setView] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const uiPrefs = useMemo(() => {
        try {
            const raw = localStorage.getItem(`ms:uiPrefs:${gameId}`);
            return JSON.parse(raw || '{}');
        }
        catch(e) {
            console.error('[GameView] Failed to parse prefs', e);
            return {};
        }
    }, [gameId]);

    const showTimer = uiPrefs.showTimer ?? true;
    const allowUndo = uiPrefs.allowUndo ?? true;
    const enableHints = uiPrefs.enableHints ?? true;
    const holdHighlight = uiPrefs.holdHighlight ?? true;

    console.log('[GameView] UI prefs', {showTimer, allowUndo, enableHints, holdHighlight});

    const [paused, setPaused] = useState(false);
    const [hintRect, setHintRect] = useState(null);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [seekIndex, setSeekIndex] = useState(0);
    const [quickFlag, setQuickFlag] = useState(false);
    const [highlightCell, setHighlightCell] = useState(null);
    const [explodedMode, setExplodedMode] = useState(false);

    // Timer state - updates every second independently
    const [timerSec, setTimerSec] = useState(0);

    const req = useCallback(async(path, init) => {
        const url = `${base}${path}`;
        console.log(`[API] ${init?.method || 'GET'} ${url}`);

        try {
            const res = await fetch(url, init);
            const data = await res.json().catch(() => ({}));

            if(!res.ok) {
                console.error(`[API] Error ${res.status}`, data);
                throw new Error(data?.error || `HTTP ${res.status}`);
            }

            console.log(`[API] Success`, data);
            return data;
        }
        catch(e) {
            console.error(`[API] Exception`, e);
            throw e;
        }
    }, [base]);

    const refresh = useCallback(async() => {
        if(!gameId) return;

        console.log('[Refresh] Fetching game state');
        const data = await req(`/game/${gameId}`, {method: 'GET'});

        setView(data);
        setQuickFlag(!!data.quickFlag);
        setSeekIndex(data.cursor ?? 0);
        setTimerSec(data.elapsedTime ?? 0);
        console.log('[Refresh] State updated', {cursor: data.cursor, status: data.status});
    }, [gameId, req]);

    useEffect(() => {
        console.log('[Effect] Initial refresh');
        refresh().catch((e) => {
            console.error('[Effect] Refresh failed', e);
            setError(String(e.message || e));
        });
    }, [refresh]);

    // Game state detection
    const beforeStart = view?.status === 'new';
    const isGameOver = view?.status === 'lost' || view?.status === 'won';
    const isExploded = explodedMode;

    console.log('[State]', {beforeStart, isGameOver, isExploded, status: view?.status});

    // Timer effect - runs only during active gameplay
    useEffect(() => {
        // Timer runs when: not paused, playing status, not exploded, not game over
        const shouldRun = showTimer && !paused && view?.status === 'playing' && !isExploded && !isGameOver;

        if(!shouldRun) {
            console.log('[Timer] Stopped', {showTimer, paused, status: view?.status, isExploded, isGameOver});
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
    }, [showTimer, paused, view?.status, isExploded, isGameOver]);

    // Sync timer when server updates elapsed time
    useEffect(() => {
        if(view?.elapsedTime !== undefined) {
            setTimerSec(view.elapsedTime);
            console.log('[Timer] Synced from server', view.elapsedTime);
        }
    }, [view?.elapsedTime]);

    const flaggedCount = view?.board?.flagged?.length ?? 0;
    const minesRemaining = Math.max(0, (view?.mines ?? 0) - flaggedCount);

    const difficulty = useMemo(() => {
        try {
            const raw = localStorage.getItem('ms:lastCreate');
            if(!raw) return null;
            const cp = JSON.parse(raw);
            return cp.preset || 'Custom';
        }
        catch(e) {
            return null;
        }
    }, []);

    useEffect(() => {
        // Detekce exploze - vstup do režimu
        if (view?.board?.lostOn && view?.lives?.left > 0) {
            if (!explodedMode) {
                console.log('[Explosion] Entering exploded mode');
                setExplodedMode(true);
            }
        }

        // Reset exploze - JEN pokud NENÍ preview
        if (explodedMode &&
            !view?.isPreview &&  // ← Klíčová změna
            !view?.board?.lostOn &&
            view?.status === 'playing') {
            console.log('[Explosion] Exiting exploded mode after revive');
            setExplodedMode(false);
        }
    }, [view?.board?.lostOn, view?.lives?.left, view?.status, view?.isPreview, explodedMode]);

    const hearts = useMemo(() => {
        const total = view?.lives?.total ?? 0;
        const left = view?.lives?.left ?? 0;
        console.log('[Hearts]', {total, left});
        return Array.from({length: total}, (_, i) => i < left);
    }, [view?.lives?.total, view?.lives?.left]);

    const isOpened = useCallback((r, c) => {
        return view?.board?.opened?.some(cell => cell.r === r && cell.c === c);
    }, [view?.board?.opened]);

    // Interaction rules according to spec
    const canReveal = !paused && !isGameOver && !busy && !isExploded;
    const canFlag = !paused && !isGameOver && !busy && !isExploded && !beforeStart;
    const canUseActions = !paused && !isGameOver && !busy && !isExploded && !beforeStart;

    console.log('[Interactions]', {canReveal, canFlag, canUseActions});

    const doReveal = useCallback(async(r, c) => {
        if(!view || !canReveal) {
            console.log('[doReveal] Blocked', {view: !!view, canReveal});
            return;
        }

        console.log('[doReveal]', {r, c});
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/reveal`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({r, c}),
            });
            setView(data);
            setSeekIndex(data.cursor ?? 0);
            setTimerSec(data.elapsedTime ?? 0);
        }
        catch(e) {
            console.error('[doReveal] Error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
        }
    }, [gameId, req, view, canReveal]);

    const doFlag = useCallback(async(r, c, set) => {
        if(!view || !canFlag) {
            console.log('[doFlag] Blocked', {view: !!view, canFlag});
            return;
        }

        console.log('[doFlag]', {r, c, set});
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/flag`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({r, c, set}),
            });
            setView(data);
            setSeekIndex(data.cursor ?? 0);
            setTimerSec(data.elapsedTime ?? 0);
        }
        catch(e) {
            console.error('[doFlag] Error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
        }
    }, [gameId, req, view, canFlag]);

    const doMoveFlag = useCallback(async(fr, fc, tr, tc) => {
        if(!view || !canFlag) return;

        console.log('[doMoveFlag]', {from: [fr, fc], to: [tr, tc]});
        setBusy(true);
        setError(null);
        try {
            await doFlag(fr, fc, false);
            await doFlag(tr, tc, true);
        }
        catch(e) {
            console.error('[doMoveFlag] Error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
        }
    }, [doFlag, view, canFlag]);

    const toggleQuickFlag = useCallback(async() => {
        if(!view || !canUseActions) return;

        console.log('[toggleQuickFlag]', {current: quickFlag});
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/mode`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({quickFlag: !quickFlag}),
            });
            setQuickFlag(!!data.quickFlagEnabled);
        }
        catch(e) {
            console.error('[toggleQuickFlag] Error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
        }
    }, [gameId, req, quickFlag, view, canUseActions]);

    const doUndo = useCallback(async() => {
        if(!allowUndo || !view || (view.cursor ?? 0) === 0 || !canUseActions) {
            console.log('[doUndo] Blocked', {allowUndo, cursor: view?.cursor, canUseActions});
            return;
        }

        console.log('[doUndo]');
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/undo`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({steps: 1}),
            });
            setView(data);
            setSeekIndex(data.cursor ?? 0);
            setTimerSec(data.elapsedTime ?? 0);
        }
        catch(e) {
            console.error('[doUndo] Error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
        }
    }, [gameId, req, view, allowUndo, canUseActions]);

    const doHint = useCallback(async() => {
        if(!enableHints || !view || !canUseActions) {
            console.log('[doHint] Blocked');
            return;
        }

        console.log('[doHint]');
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/hint`, {method: 'GET'});
            if(data?.type === 'mine-area') {
                setHintRect(data.rect);
                setHintsUsed(h => h + 1);
                setTimeout(() => setHintRect(null), 2500);
                console.log('[doHint] Showing rect', data.rect);
            }
        }
        catch(e) {
            console.error('[doHint] Error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
        }
    }, [gameId, req, view, enableHints, canUseActions]);

    const doUndoAndRevive = useCallback(async() => {
        if(!view || paused || busy) return;

        console.log('[doUndoAndRevive]');
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/revive`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({}), // No toIndex = undo and revive
            });
            setView(data);
            setSeekIndex(data.cursor ?? 0);
            setTimerSec(data.elapsedTime ?? 0);
        }
        catch(e) {
            console.error('[doUndoAndRevive] Error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
        }
    }, [gameId, req, paused, busy, view]);

    const doReviveFromMove = useCallback(async() => {
        if(!view || paused || busy) return;

        console.log('[doReviveFromMove]', {seekIndex});
        setBusy(true);
        setError(null);
        try {
            const data = await req(`/game/${gameId}/revive`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({toIndex: seekIndex}),
            });
            setView(data);
            setSeekIndex(data.cursor ?? 0);
            setTimerSec(data.elapsedTime ?? 0);
        }
        catch(e) {
            console.error('[doReviveFromMove] Error', e);
            setError(String(e.message || e));
        }
        finally {
            setBusy(false);
        }
    }, [gameId, req, seekIndex, paused, busy, view]);

    const handleSliderChange = useCallback(async (v) => {
        if (busy) return;

        const endpoint = explodedMode || isGameOver ? 'preview' : 'seek';

        console.log('[Slider]', {endpoint, toIndex: v, explodedMode, isGameOver});

        try {
            setBusy(true);
            const data = await req(`/game/${gameId}/${endpoint}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({toIndex: v}),
            });

            // Preview NEMĚNÍ skutečný cursor - jen zobrazí
            if (endpoint === 'preview') {
                setSeekIndex(v); // Jen pro UI display
            }

            setView(data);
        } catch(e) {
            console.error(`[Slider] error`, e);
        } finally {
            setBusy(false);
        }
    }, [gameId, req, explodedMode, isGameOver, busy]);

    const handleBeginHold = useCallback((r, c) => {
        if(holdHighlight && isOpened(r, c)) {
            console.log('[Hold] Begin', {r, c});
            setHighlightCell({r, c});
        }
    }, [isOpened, holdHighlight]);

    const handleEndHold = useCallback(() => {
        console.log('[Hold] End');
        setHighlightCell(null);
    }, []);

    // Convert permanent flags to Set for MineGrid
    const permanentFlagsSet = useMemo(() => {
        const set = new Set();
        for(const {r, c} of view?.board?.permanentFlags || []) {
            set.add(`${r},${c}`);
        }
        return set;
    }, [view?.board?.permanentFlags]);

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
        return (
                <div style={page}>
                    <Header showBack={true} onNavigate={() => navigate(-1)} />
                    <div style={{...shell, placeItems: 'center'}}>
                        <div style={{color: colors.text_header}}>Loading game…</div>
                    </div>
                </div>
        );
    }

    return (
            <div style={page}>
                <Header showBack={true} onNavigate={() => navigate(-1)} />

                <div style={shell}>
                    <Box
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
                                    <span key={i} style={{fontSize: 28}}>
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
                    </Box>

                    <div style={boardWrap}>
                        <div style={{opacity: paused ? 0.2 : 1, transition: 'opacity 120ms'}}>
                            <MineGrid
                                    rows={view.rows}
                                    cols={view.cols}
                                    opened={view.board.opened}
                                    flagged={view.board.flagged}
                                    permanentFlags={permanentFlagsSet}
                                    lostOn={view.board?.lostOn}
                                    hintRect={hintRect}
                                    highlightCell={highlightCell}
                                    quickFlag={quickFlag}
                                    isPaused={isExploded}
                                    beforeStart={beforeStart}
                                    onReveal={(r, c) => canReveal && doReveal(r, c)}
                                    onFlag={(r, c, set) => canFlag && doFlag(r, c, set)}
                                    onMoveFlag={(fr, fc, tr, tc) => canFlag && doMoveFlag(fr, fc, tr, tc)}
                                    onBeginHold={handleBeginHold}
                                    onEndHold={handleEndHold}
                                    holdHighlight={holdHighlight}
                                    mines={view.board.mines}
                            />
                        </div>

                        {!isGameOver && !isExploded ? (
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
                                            disabled={!enableHints || !canUseActions}
                                            onClick={doHint}
                                    />
                                    <BarBtn
                                            icon={paused ? IPlay : IPause}
                                            label={paused ? 'Resume' : 'Pause'}
                                            disabled={beforeStart}
                                            onClick={() => {
                                                console.log('[Pause] Toggle', {paused});
                                                setPaused((p) => !p);
                                            }}
                                    />
                                    <BarBtn
                                            icon={IUndo}
                                            label="Undo"
                                            disabled={!allowUndo || !canUseActions || (view.cursor ?? 0) === 0}
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
                                            disabled={!canUseActions}
                                            onClick={toggleQuickFlag}
                                            active={quickFlag}
                                    />
                                    <BarBtn
                                            icon={IDrag}
                                            label="Drag Flag"
                                            disabled={!canUseActions}
                                            onClick={() => {}}
                                    />
                                </div>
                        ) : isExploded ? (
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
                                                    value={view.cursor ?? 0}
                                                    onChange={handleSliderChange}
                                            />
                                        </div>
                                        <NumberField
                                                presetValue={view.cursor ?? 0}
                                                minValue={0}
                                                maxValue={view.totalActions ?? 0}
                                                onChange={(v) => handleSliderChange(v)}
                                        />
                                    </div>
                                    <div style={{display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center'}}>
                                        <ActionPill onClick={doUndoAndRevive} disabled={busy}>
                                            Undo & Revive
                                        </ActionPill>
                                        <ActionPill onClick={doReviveFromMove} disabled={busy}>
                                            Revive from Move {view.cursor ?? 0}
                                        </ActionPill>
                                        <ActionPill onClick={() => navigate('/minesweeper')}>
                                            Play Again
                                        </ActionPill>
                                    </div>
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
                                                        onChange={handleSliderChange}
                                                />
                                            </div>
                                            <NumberField
                                                    value={seekIndex}
                                                    onChange={(v) => handleSliderChange(v)}
                                                    min={0}
                                                    max={view.totalActions ?? 0}
                                            />
                                        </div>
                                        <div style={{display: 'flex', gap: 16}}>
                                            <ActionPill onClick={() => navigate('/minesweeper')}>
                                                Play Again
                                            </ActionPill>
                                            <ActionPill onClick={() => navigate('/')}>
                                                Exit Minesweeper
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

export default MinesweeperGameView;
