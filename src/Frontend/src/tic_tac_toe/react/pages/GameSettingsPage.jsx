/**
 * @file    GameSettingsPage.jsx
 * @brief   Tic-Tac-Toe game settings page (component-based, responsive).
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

// src/tic_tac_toe/react/pages/GameSettingsPage.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// IMPORTANT: useGame from GameContext, not directly from useGame.js
import { useGame } from '../hooks/gameContext.js';

import Header from '../../../components/Header';
import UnderHeader from '../components/underHeader.jsx';
import Board from '../components/board.jsx';

// Palette
import colors from '../../../Colors';

// Reusable UI controls (already in project)
import Slider from '../../../components/Slider.jsx';
import SettingRow from '../../../components/SettingsRow.jsx';
import ToggleButton from '../../../components/ToggleButton.jsx';
import NumberBox from '../components/settings/numberBox.jsx';

import Pill from '../components/pill.jsx';
import PlayerBadge from '../components/playerBadge.jsx';

export default function GameSettingsPage() {
    const nav = useNavigate();
    const { newGame } = useGame();
    const headerRef = useRef(null);

    // Measure available width for sliders inside the "Board & timer" card
    const boardCardRef = useRef(null);
    const [sliderWidth, setSliderWidth] = useState(260);

    const [mode, setMode] = useState('pve');
    const [difficulty, setDifficulty] = useState('easy');
    const [size, setSize] = useState(5);
    const [k, setK] = useState(5);
    const [start, setStart] = useState('X');
    const [yourSymbol, setYourSymbol] = useState('X');

    const [timerOn, setTimerOn] = useState(true);
    const [timerSec, setTimerSec] = useState(90);

    const [xName, setXName] = useState('Player1');
    const [oName, setOName] = useState('Computer');

    const clampInt = (v, lo, hi, fallback) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(lo, Math.min(hi, Math.round(n)));
    };

    useEffect(() => {
        setOName(mode === 'pve' ? 'Computer' : 'Player2');
        if (mode === 'pvp') setYourSymbol('X');
    }, [mode]);

    // Bounds
    const timerMin = 5;
    const timerMax = 600;
    const timerStep = 5;

    useEffect(() => {
        if (timerOn && Number(timerSec) < timerMin) setTimerSec(90);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timerOn]);

    const kMin = 3;
    const kMax = Math.min(size, 5);
    const allowedK = [3, 4, 5].filter((v) => v <= size);

    useEffect(() => {
        setK((prev) => (allowedK.includes(prev) ? prev : allowedK.at(-1) ?? 3));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size]);

    useLayoutEffect(() => {
        const el = boardCardRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;

        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

        const recalc = () => {
            const w = Math.round(el.getBoundingClientRect().width || 0);
            // Leave room for label + NumberBox; allow wrap on tiny widths.
            const next = clamp(w - 260, 160, 380);
            setSliderWidth(next);
        };

        recalc();
        const ro = new ResizeObserver(recalc);
        ro.observe(el);
        window.addEventListener('resize', recalc);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', recalc);
        };
    }, []);

    // ===== Derived values (safe & preview) =====
    const previewSize = clampInt(size, 3, 8, 5);
    const previewKToWin = clampInt(k, 3, Math.min(previewSize, 5), 3);

    const safeTimerSec = clampInt(timerSec, timerMin, timerMax, 90);
    const effectiveTimerSec = timerOn ? safeTimerSec : 0;

    const previewBoard = Array.from({ length: previewSize }, () => Array(previewSize).fill(null));

    const modeLabel = mode === 'pve' ? 'Bot' : '2 Players';
    const difficultyLabel = mode === 'pve' ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : '—';
    const timerLabel = timerOn ? `${effectiveTimerSec}s` : 'Off';

    const xLabel = (xName || 'Player1').trim();
    const oLabel = (oName || (mode === 'pve' ? 'Computer' : 'Player2')).trim();

    async function onPlay() {
        const startMark = start === 'random' ? (Math.random() < 0.5 ? 'X' : 'O') : start;

        const safeSize = clampInt(size, 3, 8, 5);
        const safeK = clampInt(k, 3, Math.min(safeSize, 5), 3);

        const players = {
            x: (xName || 'Player1').trim(),
            o: (oName || (mode === 'pve' ? 'Computer' : 'Player2')).trim(),
        };

        const settings = {
            mode,
            size: safeSize,
            kToWin: safeK,
            startMark,
            humanMark: yourSymbol,
            difficulty,
            timer: { enabled: !!timerOn, seconds: effectiveTimerSec },
        };

        sessionStorage.setItem('ttt.settings', JSON.stringify(settings));

        const timerSeed = { enabled: !!timerOn, totalSec: effectiveTimerSec, startedAt: Date.now() };
        sessionStorage.setItem('ttt.timer', JSON.stringify(timerSeed));

        await newGame({
            size: safeSize,
            kToWin: safeK,
            mode,
            startMark,
            difficulty,
            turnTimerSec: effectiveTimerSec,
            humanMark: yourSymbol,
            playerName: players.x,
            players,
        });

        nav('/tic-tac-toe');
    }

    function onSpectate() {
        const safeSize = clampInt(size, 3, 8, 5);
        const safeK = clampInt(k, 3, Math.min(safeSize, 5), 3);

        const params = new URLSearchParams({
            size: String(safeSize),
            kToWin: String(safeK),
            difficulty,
        });

        nav(`/tic-tac-toe/spectate?${params.toString()}`);
    }

    // ===== Styles (use provided palette) =====
    const page = {
        minHeight: '100svh',
        width: '100%',
        background: `linear-gradient(to bottom,
      ${colors.secondary} 0%,
      ${colors.primary} 20%,
      ${colors.primary} 60%,
      ${colors.secondary} 100%)`,
        color: colors.text,
        overflowX: 'hidden',
        overflowY: 'auto',
    };

    const shell = {
        boxSizing: 'border-box',
        width: 'min(1280px, 96vw)',
        margin: '0 auto',
        paddingInline: 'clamp(16px, 3vw, 32px)',
        paddingBottom: '32px',
    };

    const grid = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'clamp(16px, 3vw, 24px)',
        alignItems: 'stretch',
    };

    const card = {
        boxSizing: 'border-box',
        borderRadius: '1rem',
        background: colors.secondary,
        padding: 'clamp(16px, 3vw, 24px)',
        boxShadow: '2px 4px 20px rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.20)',
    };

    const cardTitle = {
        margin: 0,
        marginBottom: '12px',
        fontSize: 'clamp(20px, 2.4vw, 26px)',
        fontWeight: 800,
        textAlign: 'center',
        color: colors.text_header,
    };

    const labelSmall = {
        fontWeight: 700,
        fontSize: 14,
        color: colors.text,
    };

    const radioGroup = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'flex-end',
    };

    const pillBaseStyle = {
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 700,
        lineHeight: '18px',
        boxShadow: 'none',
    };

    const inputText = {
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.35)',
        background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%),
                 ${colors.primary}`,
        color: colors.text_header,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    };

    const boardWrap = {
        width: '100%',
        maxWidth: 260,
        margin: '12px auto 16px auto',
        aspectRatio: '1 / 1',
        position: 'relative',
        filter: 'drop-shadow(-2px 3px 4px rgba(255,255,255,0.25))',
    };

    const previewList = {
        fontSize: 14,
        lineHeight: 1.5,
        color: colors.text,
    };

    const buttonsRow = {
        marginTop: 24,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    };

    const primaryBtn = {
        padding: '10px 22px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.25)',
        background: `linear-gradient(135deg, ${colors.win} 0%, #16a34a 55%, ${colors.secondary} 140%)`,
        color: colors.black,
        fontWeight: 800,
        fontSize: 16,
        cursor: 'pointer',
    };

    const secondaryBtn = {
        padding: '10px 22px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.35)',
        background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%),
                 ${colors.secondary}`,
        color: colors.text_header,
        fontWeight: 700,
        fontSize: 15,
        cursor: 'pointer',
    };

    const controlWrap = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
        flexWrap: 'wrap',
    };

    // badges +20% (from your smaller value)
    const nameBadgeSize = 'clamp(34px, 6.7vmin, 52.8px)';

    const namesGrid = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 12,
        alignItems: 'start',
        marginTop: 10,
    };

    const nameCol = {
        display: 'grid',
        justifyItems: 'center',
        gap: 8,
    };

    // hide labels under badges (inside PlayerBadge) for card 2
    const badgeHideLabel = { width: 0, height: 0, overflow: 'hidden', opacity: 0, margin: 0, padding: 0 };

    // IMPORTANT: pass clamp strings -> ensures NumberBox renders responsively
    const nbSmallW = 'clamp(52px, 7vw, 80px)'; // 1 digit
    const nbSmallH = 'clamp(30px, 4.5vmin, 40px)';
    const nbTimerW = 'clamp(86px, 11vw, 130px)'; // 3 digits + suffix
    const nbTimerH = nbSmallH;

    // Card 1: add space between rows
    const rowGap = { marginTop: 10 };

    // badges row in preview card + VS in middle
    const previewBadges = {
        marginTop: 14,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: 10,
        alignItems: 'center',
        justifyItems: 'center',
    };

    const vsText = {
        fontSize: 'clamp(14px, 1.6vw, 18px)',
        fontWeight: 900,
        color: colors.text_header,
        opacity: 0.9,
        letterSpacing: 1,
        userSelect: 'none',
        paddingInline: 6,
    };

    // smaller label under badges for preview (we keep labels visible there, just smaller)
    const previewBadgeLabelScale = 0.78;

    // ===== UI =====
    return (
            <div style={page}>
                <div ref={headerRef}>
                    <Header
                            showBack={false}
                            onNavigate={(arg) => (arg === 'back' ? nav('/') : nav(String(arg || '/')))}
                    />
                </div>

                <UnderHeader headerRef={headerRef} center minRem={5} extraTopPx={8} scrollY="auto">
                    <div style={shell}>
                        <h1
                                style={{
                                    margin: '0 0 18px 0',
                                    fontSize: 'clamp(34px, 4.0vw, 56px)',
                                    fontWeight: 800,
                                    textAlign: 'center',
                                    color: colors.text_header,
                                    lineHeight: 1.08,
                                }}
                        >
                            Game settings
                        </h1>

                        <div style={grid}>
                            {/* Card 1 – Game basics */}
                            <div style={card}>
                                <h2 style={cardTitle}>Game basics</h2>

                                <SettingRow
                                        label={<span style={labelSmall}>Mode</span>}
                                        control={
                                            <div style={radioGroup}>
                                                <Pill active={mode === 'pve'} onClick={() => setMode('pve')} style={pillBaseStyle}>
                                                    Bot
                                                </Pill>
                                                <Pill active={mode === 'pvp'} onClick={() => setMode('pvp')} style={pillBaseStyle}>
                                                    2 Players
                                                </Pill>
                                            </div>
                                        }
                                />

                                <div style={rowGap} />

                                <SettingRow
                                        label={<span style={labelSmall}>Bot difficulty</span>}
                                        control={
                                            <div style={radioGroup}>
                                                {['easy', 'medium', 'hard'].map((d) => {
                                                    const disabled = mode !== 'pve';
                                                    return (
                                                            <Pill
                                                                    key={d}
                                                                    active={mode === 'pve' && difficulty === d}
                                                                    onClick={() => {
                                                                        if (!disabled) setDifficulty(d);
                                                                    }}
                                                                    style={{
                                                                        ...pillBaseStyle,
                                                                        opacity: disabled ? 0.45 : 1,
                                                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                                                    }}
                                                            >
                                                                {d.charAt(0).toUpperCase() + d.slice(1)}
                                                            </Pill>
                                                    );
                                                })}
                                            </div>
                                        }
                                />

                                <div style={rowGap} />

                                <SettingRow
                                        label={<span style={labelSmall}>Starting player</span>}
                                        control={
                                            <div style={radioGroup}>
                                                {['X', 'O', 'random'].map((s) => (
                                                        <Pill key={s} active={start === s} onClick={() => setStart(s)} style={pillBaseStyle}>
                                                            {s === 'random' ? 'Random' : s}
                                                        </Pill>
                                                ))}
                                            </div>
                                        }
                                />

                                <div style={rowGap} />

                                <SettingRow
                                        label={<span style={labelSmall}>Your symbol</span>}
                                        control={
                                            <div style={radioGroup}>
                                                {['X', 'O'].map((s) => {
                                                    const disabled = mode !== 'pve';
                                                    return (
                                                            <Pill
                                                                    key={s}
                                                                    active={mode === 'pve' && yourSymbol === s}
                                                                    onClick={() => {
                                                                        if (!disabled) setYourSymbol(s);
                                                                    }}
                                                                    style={{
                                                                        ...pillBaseStyle,
                                                                        opacity: disabled ? 0.45 : 1,
                                                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                                                    }}
                                                            >
                                                                {s}
                                                            </Pill>
                                                    );
                                                })}
                                            </div>
                                        }
                                />
                            </div>

                            {/* Card 2 – Board & timer & names */}
                            <div style={card} ref={boardCardRef}>
                                <h2 style={cardTitle}>Board & timer</h2>

                                <SettingRow
                                        label={<span style={labelSmall}>Board size</span>}
                                        description="3…8"
                                        control={
                                            <div style={controlWrap}>
                                                <Slider
                                                        min={3}
                                                        max={8}
                                                        step={1}
                                                        value={previewSize}
                                                        onChange={(v) => setSize(clampInt(v, 3, 8, 5))}
                                                        width={sliderWidth}
                                                        trackHeight={14}
                                                        thumbSize={28}
                                                        labelRight={`${previewSize}×${previewSize}`}
                                                />
                                                <NumberBox
                                                        value={previewSize}
                                                        min={3}
                                                        max={8}
                                                        step={1}
                                                        onChange={(v) => setSize(clampInt(v, 3, 8, 5))}
                                                        width={nbSmallW}
                                                        height={nbSmallH}
                                                        ariaLabel="Board size"
                                                />
                                            </div>
                                        }
                                />

                                <SettingRow
                                        label={<span style={labelSmall}>K to win</span>}
                                        description={`Valid range: ${kMin}…${kMax}`}
                                        control={
                                            <div style={controlWrap}>
                                                <Slider
                                                        min={kMin}
                                                        max={kMax}
                                                        step={1}
                                                        value={previewKToWin}
                                                        onChange={(v) => setK(clampInt(v, kMin, kMax, previewKToWin))}
                                                        width={sliderWidth}
                                                        trackHeight={14}
                                                        thumbSize={28}
                                                        labelRight={`${previewKToWin}`}
                                                />
                                                <NumberBox
                                                        value={previewKToWin}
                                                        min={kMin}
                                                        max={kMax}
                                                        step={1}
                                                        onChange={(v) => setK(clampInt(v, kMin, kMax, previewKToWin))}
                                                        width={nbSmallW}
                                                        height={nbSmallH}
                                                        ariaLabel="K to win"
                                                />
                                            </div>
                                        }
                                />

                                <SettingRow
                                        label={<span style={labelSmall}>Turn timer</span>}
                                        control={
                                            <div style={{ ...controlWrap, alignItems: 'center' }}>
                                                <ToggleButton checked={!!timerOn} onChange={setTimerOn} size="sm" />

                                                <div
                                                        style={{
                                                            opacity: timerOn ? 1 : 0.45,
                                                            pointerEvents: timerOn ? 'auto' : 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            flexWrap: 'wrap',
                                                            justifyContent: 'flex-end',
                                                        }}
                                                >
                                                    <Slider
                                                            min={timerMin}
                                                            max={timerMax}
                                                            step={timerStep}
                                                            value={safeTimerSec}
                                                            onChange={(v) => setTimerSec(clampInt(v, timerMin, timerMax, 90))}
                                                            width={sliderWidth}
                                                            trackHeight={14}
                                                            thumbSize={28}
                                                            labelRight={`${safeTimerSec}s`}
                                                    />
                                                    <NumberBox
                                                            value={safeTimerSec}
                                                            min={timerMin}
                                                            max={timerMax}
                                                            step={timerStep}
                                                            onChange={(v) => setTimerSec(clampInt(v, timerMin, timerMax, 90))}
                                                            width={nbTimerW}
                                                            height={nbTimerH}
                                                            suffix="s"
                                                            ariaLabel="Turn timer seconds"
                                                    />
                                                </div>
                                            </div>
                                        }
                                />

                                {/* Player names: NO labels under badges; keep ONLY inputs */}
                                <div style={{ marginTop: 12 }}>
                                    <div style={namesGrid}>
                                        <div style={nameCol}>
                                            <div style={badgeHideLabel}>
                                                <PlayerBadge kind="X" label={xLabel} size={nameBadgeSize} />
                                            </div>
                                            {/* Keep icon only: render badge but hide its label via wrapper */}
                                            <div style={{ display: 'grid', justifyItems: 'center' }}>
                                                <div style={{ ...badgeHideLabel, position: 'absolute' }} />
                                                <PlayerBadge kind="X" label={xLabel} size={nameBadgeSize} />
                                            </div>

                                            <input
                                                    style={inputText}
                                                    value={xName}
                                                    onChange={(e) => setXName(e.target.value)}
                                                    aria-label="Player X name"
                                                    placeholder="Player X"
                                            />
                                        </div>

                                        <div style={nameCol}>
                                            <div style={{ display: 'grid', justifyItems: 'center' }}>
                                                <PlayerBadge kind="O" label={oLabel} size={nameBadgeSize} />
                                            </div>

                                            <input
                                                    style={inputText}
                                                    value={oName}
                                                    onChange={(e) => setOName(e.target.value)}
                                                    aria-label="Player O name"
                                                    placeholder={mode === 'pve' ? 'Computer' : 'Player O'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3 – Live preview */}
                            <div style={card}>
                                <h2 style={cardTitle}>Preview</h2>

                                <div style={boardWrap}>
                                    <Board
                                            board={previewBoard}
                                            size={previewSize}
                                            disabled
                                            pendingMove={null}
                                            winnerLine={null}
                                            winnerMark={null}
                                            showStrike={false}
                                            onCell={() => {}}
                                    />
                                </div>

                                <div style={previewList}>
                                    <div>
                                        <strong>Mode:</strong> {modeLabel}
                                    </div>
                                    <div>
                                        <strong>Difficulty:</strong> {difficultyLabel}
                                    </div>
                                    <div>
                                        <strong>Board:</strong> {previewSize}×{previewSize}, K = {previewKToWin}
                                    </div>
                                    <div>
                                        <strong>Starting player:</strong> {start === 'random' ? 'Random' : start}
                                    </div>
                                    {mode === 'pve' && (
                                            <div>
                                                <strong>Your symbol:</strong> {yourSymbol}
                                            </div>
                                    )}
                                    <div>
                                        <strong>Timer:</strong> {timerLabel}
                                    </div>

                                    {/* badges + VS, and smaller labels under them */}
                                    <div style={previewBadges}>
                                        <div style={{ transform: `scale(${previewBadgeLabelScale})`, transformOrigin: 'center' }}>
                                            <PlayerBadge kind="X" label={xLabel} size={nameBadgeSize} />
                                        </div>

                                        <div style={vsText}>VS.</div>

                                        <div style={{ transform: `scale(${previewBadgeLabelScale})`, transformOrigin: 'center' }}>
                                            <PlayerBadge kind="O" label={oLabel} size={nameBadgeSize} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={buttonsRow}>
                            <button onClick={onPlay} style={primaryBtn}>
                                ▶ Play
                            </button>
                            <button onClick={onSpectate} style={secondaryBtn}>
                                Spectate
                            </button>
                            <button onClick={() => nav(-1)} style={secondaryBtn}>
                                Back
                            </button>
                        </div>
                    </div>
                </UnderHeader>
            </div>
    );
}
