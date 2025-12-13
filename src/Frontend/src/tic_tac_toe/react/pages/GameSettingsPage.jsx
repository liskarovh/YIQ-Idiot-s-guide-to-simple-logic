/**
 * @file    GameSettingsPage.jsx
 * @brief   Tic-Tac-Toe game settings page.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/gameContext.js';
import Header from '../../../components/Header';
import UnderHeader from '../components/underHeader.jsx';
import Board from '../components/board.jsx';
import MarkO from '../components/marks/markO.jsx';
import MarkX from '../components/marks/markX.jsx';
import colors from '../../../Colors';
import SettingRow from '../../../components/SettingsRow.jsx';
import ToggleButton from '../../../components/ToggleButton.jsx';
import PlayerBadge from '../components/playerBadge.jsx';
import SettingsToolbar from '../components/settings/settingsToolbar.jsx';
import useMeasuredSliderWidth from '../hooks/useMeasuredSliderWidth.js';
import SettingsSliderRow from '../components/settings/settingsSliderRow.jsx';
import PillRadioRow from '../components/settings/pillRadioRow.jsx';
import PlayersEditor from '../components/settings/playersEditor.jsx';
import PreviewStatRow from '../components/settings/previewStatRow.jsx';

export default function GameSettingsPage() {
    const nav = useNavigate();
    const { newGame } = useGame();
    const headerRef = useRef(null);
    const boardCardRef = useRef(null);

    const sliderWidth = useMeasuredSliderWidth(boardCardRef, 280, 110, 420, 220);

    // ===== Core settings state =====
    const [mode, setMode] = useState('pve');        // 'pve' | 'pvp'
    const [difficulty, setDifficulty] = useState('easy');
    const [size, setSize] = useState(5);            // board size (3–8)
    const [k, setK] = useState(5);                  // K to win (3–5, ≤ size)
    const [start, setStart] = useState('X');        // 'X' | 'O' | 'random'
    const [yourSymbol, setYourSymbol] = useState('X'); // PvE only: 'X' | 'O'

    // Timer settings
    const [timerOn, setTimerOn] = useState(true);
    const [timerSec, setTimerSec] = useState(90);

    // Player names
    const [xName, setXName] = useState('Player1');
    const [oName, setOName] = useState('Computer');

    /**
     * Clamp a value to [lo, hi] interval
     */
    const clampInt = (v, lo, hi, fallback) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(lo, Math.min(hi, Math.round(n)));
    };

    useEffect(() => {
        setOName(mode === 'pve' ? 'Computer' : 'Player2');
        if (mode === 'pvp') setYourSymbol('X');
    }, [mode]);

    // ===== Timer bounds  =====
    const timerMin = 5;
    const timerMax = 600;
    const timerStep = 5;

    useEffect(() => {
        if (timerOn && Number(timerSec) < timerMin) setTimerSec(90);
    }, [timerOn]);

    // ===== K to win bounds =====
    const kMin = 3;
    const kMax = Math.min(size, 5);
    const allowedK = [3, 4, 5].filter((v) => v <= size);

    // Adjust K when board size changes
    useEffect(() => {
        setK((prev) => (allowedK.includes(prev) ? prev : allowedK.at(-1) ?? 3));
    }, [size]);

    // ===== Derived values used for preview / session storage =====
    const previewSize = clampInt(size, 3, 8, 5);
    const previewKToWin = clampInt(k, 3, Math.min(previewSize, 5), 3);

    const safeTimerSec = clampInt(timerSec, timerMin, timerMax, 90);
    const effectiveTimerSec = timerOn ? safeTimerSec : 0;

    // Empty board preview
    const previewBoard = Array.from({ length: previewSize }, () =>
            Array(previewSize).fill(null),
    );

    const modeLabel = mode === 'pve' ? 'Bot' : '2 Players';
    const difficultyLabel =
            mode === 'pve'
                    ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
                    : '—';

    // Format seconds as m:ss
    const formatMmSs = (sec) => {
        const s = Math.max(0, Math.floor(Number(sec) || 0));
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${String(r).padStart(2, '0')}`;
    };

    const timerLabel = timerOn ? formatMmSs(effectiveTimerSec) : 'Off';

    // Display names for badges
    const xLabel = (xName || 'Player1').trim();
    const oLabel = (oName || (mode === 'pve' ? 'Computer' : 'Player2')).trim();

    /**
     * Start a new game with the current settings
     */
    async function onPlay() {
        const startMark =
                start === 'random' ? (Math.random() < 0.5 ? 'X' : 'O') : start;

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

        const timerSeed = {
            enabled: !!timerOn,
            totalSec: effectiveTimerSec,
            startedAt: Date.now(),
        };
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

    /**
     * Start spectator mode
     */
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

    // ===== Layout + styling =====
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

    // Responsive cards layout: 3 cards next to each other on wide screens
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
        fontSize: 'clamp(20px, 2.4vw, 26px)',
        fontWeight: 800,
        textAlign: 'center',
        color: colors.text_header,
    };

    // Extra space under title
    const cardTitleLoose = {
        ...cardTitle,
        marginBottom: 34,
    };

    // Standard title spacing
    const cardTitleNormal = {
        ...cardTitle,
        marginBottom: 12,
    };

    // Shared label style for SettingRow labels
    const labelSmall = {
        fontWeight: 900,
        fontSize: 'clamp(16px, 1.55vw, 20px)',
        color: colors.white || colors.text_header,
    };

    // Common height baseline for SettingRow rows
    const rowMinH = 'clamp(42px, 6vmin, 50px)';

    const rowLabelWrap = {
        minHeight: rowMinH,
        display: 'flex',
        alignItems: 'center',
    };
    const rowControlWrap = {
        minHeight: rowMinH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: '100%',
    };
    const rowControlCenterWrap = {
        ...rowControlWrap,
        justifyContent: 'center',
    };

    const titleOnlyControlWrap = {
        minHeight: rowMinH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
    };

    const radioGroup = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'flex-end',
        alignItems: 'center',
    };

    // Base pill style
    const pillBaseStyle = {
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 700,
        lineHeight: '18px',
        boxShadow: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 34,
    };

    // Text inputs for player names
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

    // Preview board container
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

    // Highlighted timer label
    const timerGreen = {
        color: colors.win || colors.text_header,
        fontWeight: 900,
        fontSize: 'clamp(18px, 2.1vw, 24px)',
        lineHeight: 1.05,
    };

    // Container styles used by <SettingsToolbar/>.
    const buttonsRow = {
        marginTop: 24,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    };

    // Common layout for slider row content
    const controlWrap = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
        flexWrap: 'wrap',
    };

    const controlWrapWide = {
        ...controlWrap,
        gap: 'clamp(18px, 3.2vw, 34px)',
        overflow: 'visible',
    };

    // Badge sizing for names
    const nameBadgeSize = 'clamp(34px, 6.7vmin, 52.8px)';

    // Icon-only wrapper: clips the label and shows only the badge circle
    const badgeIconOnlyWrap = {
        width: nameBadgeSize,
        height: nameBadgeSize,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
    };

    // Two-column layout for X/O badges
    const playersGrid = {
        width: 'min(420px, 100%)',
        marginInline: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 12,
        alignItems: 'center',
        justifyItems: 'center',
    };

    // Extra vertical padding around the badge row
    const playersBadgesPad = {
        width: '100%',
        paddingTop: 'clamp(10px, 2.4vmin, 18px)',
        paddingBottom: 'clamp(12px, 2.8vmin, 22px)',
        display: 'grid',
        justifyItems: 'center',
    };

    // Two-column grid for name inputs (X/O)
    const playersInputsGrid = {
        width: 'min(420px, 100%)',
        marginInline: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 12,
        alignItems: 'center',
    };

    // NumberBox dimensions for board size and K.
    const nbSmallW = 'clamp(65px, 5.5vw, 90px)';
    const nbSmallH = 'clamp(28px, 4.2vmin, 36px)';

    // NumberBox dimensions for timer.
    const nbTimerW = 'clamp(65px, 7.5vw, 110px)';
    const nbTimerH = nbSmallH;

    // Spacing between rows in card 1
    const rowBlock = { marginTop: 12 };

    // Spacing in card 2
    const rowBlock2 = { marginTop: 'clamp(18px, 3vmin, 28px)' };
    const rowBlock2Small = { marginTop: 'clamp(8px, 1.8vmin, 14px)' };
    const rowBlock2AfterSlider = { marginTop: 'clamp(34px, 5.2vmin, 56px)' };

    const nbValueText = {
        fontWeight: 900,
        color: colors.text_header,
        fontSize: 'clamp(18px, 2.2vw, 24px)',
        lineHeight: 1,
        minWidth: 64,
        textAlign: 'right',
        userSelect: 'none',
    };

    const sliderDock = {
        position: 'relative',
        width: sliderWidth,
        minHeight: rowMinH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    };

    const sliderRangeRow = {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 'calc(100% + clamp(3px, 0.8vmin, 6px))',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: 800,
        color: colors.text_header,
        opacity: 0.75,
        lineHeight: 1,
        userSelect: 'none',
        paddingInline: 2,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
    };

    const timerToggleScale = 0.82;

    const vsRow = {
        marginTop: 6,
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(6px, 1.6vw, 12px)',
        flexWrap: 'nowrap',
    };

    const vsText = {
        fontSize: 'clamp(14px, 1.6vw, 18px)',
        fontWeight: 900,
        color: colors.text_header,
        opacity: 0.9,
        letterSpacing: 1,
        userSelect: 'none',
    };

    const previewScale = 0.78;
    const previewBadgePropSize = 'clamp(44px, 8vmin, 70px)';

    const previewBadgeWrap = {
        transform: `scale(${previewScale})`,
        transformOrigin: 'center',
    };

    const labelSmallPreview = {
        ...labelSmall,
        color: colors.text_header,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
        maxWidth: '100%',
    };

    const rowLabelWrapPreview = {
        ...rowLabelWrap,
        whiteSpace: 'nowrap',
        alignItems: 'center',
    };
    const rowControlWrapPreview = {
        ...rowControlWrap,
        alignItems: 'center',
    };


    const previewValueText = {
        fontWeight: 900,
        fontSize: labelSmallPreview.fontSize,
        color: colors.text_header,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
    };

    // Inline mark wrapper for MarkX/MarkO
    const markInline = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        verticalAlign: 'middle',
    };

    const markSize = 'clamp(22px, 2.2vw, 28px)';

    // ===== Render =====
    return (
            <div style={page}>
                {/* Sticky header with navigation handling */}
                <div ref={headerRef}>
                    <Header
                            showBack={false}
                            onNavigate={(arg) =>
                                    arg === 'back' ? nav('/') : nav(String(arg || '/'))
                            }
                    />
                </div>

                <UnderHeader
                        headerRef={headerRef}
                        center
                        minRem={5}
                        extraTopPx={8}
                        scrollY="auto"
                >
                    <div style={shell}>
                        {/* Page title */}
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

                        {/* Cards */}
                        <div style={grid}>
                            {/* Card 1 – game mode, difficulty, marks, player names */}
                            <div style={card}>
                                <h2 style={cardTitleLoose}>Game basics</h2>

                                {/* Mode (PvE / PvP) */}
                                <PillRadioRow
                                        label="Mode"
                                        value={mode}
                                        onChange={setMode}
                                        options={[
                                            { key: 'pve', label: 'Bot' },
                                            { key: 'pvp', label: '2 Players' },
                                        ]}
                                        rowLabelWrap={rowLabelWrap}
                                        labelStyle={labelSmall}
                                        rowControlWrap={rowControlWrap}
                                        radioGroup={radioGroup}
                                        pillBaseStyle={pillBaseStyle}
                                />

                                <div style={rowBlock} />

                                {/* Bot difficulty */}
                                <PillRadioRow
                                        label="Bot difficulty"
                                        value={difficulty}
                                        onChange={setDifficulty}
                                        activeGuard={mode === 'pve'}
                                        options={['easy', 'medium', 'hard'].map((d) => ({
                                            key: d,
                                            label:
                                                    d.charAt(0).toUpperCase() + d.slice(1),
                                            disabled: mode !== 'pve',
                                        }))}
                                        rowLabelWrap={rowLabelWrap}
                                        labelStyle={labelSmall}
                                        rowControlWrap={rowControlWrap}
                                        radioGroup={radioGroup}
                                        pillBaseStyle={pillBaseStyle}
                                />

                                <div style={rowBlock} />

                                {/* Starting player (X / O / Random) */}
                                <PillRadioRow
                                        label="Starting player"
                                        value={start}
                                        onChange={setStart}
                                        options={['X', 'O', 'random'].map((s) => ({
                                            key: s,
                                            label: s === 'random' ? 'Random' : s,
                                        }))}
                                        rowLabelWrap={rowLabelWrap}
                                        labelStyle={labelSmall}
                                        rowControlWrap={rowControlWrap}
                                        radioGroup={radioGroup}
                                        pillBaseStyle={pillBaseStyle}
                                />

                                <div style={rowBlock} />

                                {/* Your symbol */}
                                <PillRadioRow
                                        label="Your symbol"
                                        value={yourSymbol}
                                        onChange={setYourSymbol}
                                        activeGuard={mode === 'pve'}
                                        options={['X', 'O'].map((s) => ({
                                            key: s,
                                            label: s,
                                            disabled: mode !== 'pve',
                                        }))}
                                        rowLabelWrap={rowLabelWrap}
                                        labelStyle={labelSmall}
                                        rowControlWrap={rowControlWrap}
                                        radioGroup={radioGroup}
                                        pillBaseStyle={pillBaseStyle}
                                />

                                <div style={rowBlock} />

                                {/* Player badges + name inputs */}
                                <PlayersEditor
                                        xName={xName}
                                        oName={oName}
                                        setXName={setXName}
                                        setOName={setOName}
                                        xLabel={xLabel}
                                        oLabel={oLabel}
                                        mode={mode}
                                        rowControlCenterWrap={rowControlCenterWrap}
                                        playersBadgesPad={playersBadgesPad}
                                        playersGrid={playersGrid}
                                        badgeIconOnlyWrap={badgeIconOnlyWrap}
                                        nameBadgeSize={nameBadgeSize}
                                        playersInputsGrid={playersInputsGrid}
                                        inputText={inputText}
                                />
                            </div>

                            {/* Card 2 – board size, K to win, timer */}
                            <div style={card} ref={boardCardRef}>
                                <h2 style={cardTitleNormal}>Board & timer</h2>
                                <div style={rowBlock2} />

                                {/* Board size – title row */}
                                <SettingRow
                                        label={null}
                                        control={
                                            <div style={titleOnlyControlWrap}>
                                        <span style={labelSmall}>
                                            Board size
                                        </span>
                                            </div>
                                        }
                                />

                                <div style={rowBlock2Small} />

                                {/* Board size – slider + number box */}
                                <SettingsSliderRow
                                        variant="dock"
                                        value={previewSize}
                                        onChange={(v) =>
                                                setSize(clampInt(v, 3, 8, 5))
                                        }
                                        min={3}
                                        max={8}
                                        step={1}
                                        sliderWidth={sliderWidth}
                                        showRange
                                        rangeLeft="3"
                                        rangeRight="8"
                                        numberBoxWidth={nbSmallW}
                                        numberBoxHeight={nbSmallH}
                                        numberBoxAriaLabel="Board size"
                                        valueText={`${previewSize}×${previewSize}`}
                                        rowControlWrap={rowControlWrap}
                                        controlWrapWide={controlWrapWide}
                                        sliderDock={sliderDock}
                                        sliderRangeRow={sliderRangeRow}
                                        nbValueText={nbValueText}
                                        trackHeight={14}
                                        thumbSize={28}
                                />

                                <div style={rowBlock2AfterSlider} />

                                {/* K to win – title row */}
                                <SettingRow
                                        label={null}
                                        control={
                                            <div style={titleOnlyControlWrap}>
                                                <span style={labelSmall}>K to win</span>
                                            </div>
                                        }
                                />

                                <div style={rowBlock2Small} />

                                {/* K to win – slider + number box */}
                                <SettingsSliderRow
                                        variant="dock"
                                        value={previewKToWin}
                                        onChange={(v) =>
                                                setK(
                                                        clampInt(
                                                                v,
                                                                kMin,
                                                                kMax,
                                                                previewKToWin,
                                                        ),
                                                )
                                        }
                                        min={kMin}
                                        max={kMax}
                                        step={1}
                                        sliderWidth={sliderWidth}
                                        showRange
                                        rangeLeft={kMin}
                                        rangeRight={kMax}
                                        numberBoxWidth={nbSmallW}
                                        numberBoxHeight={nbSmallH}
                                        numberBoxAriaLabel="K to win"
                                        valueText={`${previewKToWin}`}
                                        rowControlWrap={rowControlWrap}
                                        controlWrapWide={controlWrapWide}
                                        sliderDock={sliderDock}
                                        sliderRangeRow={sliderRangeRow}
                                        nbValueText={nbValueText}
                                        trackHeight={14}
                                        thumbSize={28}
                                />

                                <div style={rowBlock2AfterSlider} />

                                {/* Turn timer – label + toggle */}
                                <SettingRow
                                        label={
                                            <div style={rowLabelWrap}>
                                        <span style={labelSmall}>
                                            Turn timer
                                        </span>
                                            </div>
                                        }
                                        control={
                                            <div style={rowControlWrap}>
                                                <div
                                                        style={{
                                                            transform: `scale(${timerToggleScale})`,
                                                            transformOrigin:
                                                                    'right center',
                                                        }}
                                                >
                                                    <ToggleButton
                                                            checked={!!timerOn}
                                                            onChange={setTimerOn}
                                                            size="sm"
                                                    />
                                                </div>
                                            </div>
                                        }
                                />

                                <div style={rowBlock2} />

                                {/* Turn timer */}
                                <SettingsSliderRow
                                        variant="plain"
                                        value={safeTimerSec}
                                        onChange={(v) =>
                                                setTimerSec(
                                                        clampInt(
                                                                v,
                                                                timerMin,
                                                                timerMax,
                                                                90,
                                                        ),
                                                )
                                        }
                                        min={timerMin}
                                        max={timerMax}
                                        step={timerStep}
                                        sliderWidth={sliderWidth}
                                        numberBoxWidth={nbTimerW}
                                        numberBoxHeight={nbTimerH}
                                        numberBoxAriaLabel="Turn timer seconds"
                                        valueText={`${safeTimerSec}s`}
                                        rowControlWrap={rowControlWrap}
                                        controlWrap={controlWrap}
                                        innerWrapStyle={{
                                            ...controlWrap,
                                            opacity: timerOn ? 1 : 0.45,
                                            pointerEvents: timerOn ? 'auto' : 'none',
                                        }}
                                        nbValueText={nbValueText}
                                        trackHeight={14}
                                        thumbSize={28}
                                />
                            </div>

                            {/* Card 3 – visual + textual preview of current settings */}
                            <div style={card}>
                                <h2 style={cardTitleNormal}>Preview</h2>

                                {/* Player badges row: X vs O */}
                                <div style={vsRow}>
                                    <div style={previewBadgeWrap}>
                                        <PlayerBadge
                                                kind="X"
                                                label={xLabel}
                                                size={previewBadgePropSize}
                                        />
                                    </div>
                                    <div style={vsText}>VS.</div>
                                    <div style={previewBadgeWrap}>
                                        <PlayerBadge
                                                kind="O"
                                                label={oLabel}
                                                size={previewBadgePropSize}
                                        />
                                    </div>
                                </div>

                                {/* Static empty board preview */}
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

                                {/* Preview list*/}
                                <div style={previewList}>
                                    <PreviewStatRow
                                            label="Mode"
                                            value={
                                                <span style={previewValueText}>
                                            {modeLabel}
                                        </span>
                                            }
                                            rowLabelWrapPreview={rowLabelWrapPreview}
                                            labelSmallPreview={labelSmallPreview}
                                            rowControlWrapPreview={rowControlWrapPreview}
                                    />

                                    <PreviewStatRow
                                            label="Difficulty"
                                            value={
                                                <span style={previewValueText}>
                                            {difficultyLabel}
                                        </span>
                                            }
                                            rowLabelWrapPreview={rowLabelWrapPreview}
                                            labelSmallPreview={labelSmallPreview}
                                            rowControlWrapPreview={rowControlWrapPreview}
                                    />

                                    <PreviewStatRow
                                            label="K"
                                            value={
                                                <span style={previewValueText}>
                                            {previewKToWin}
                                        </span>
                                            }
                                            rowLabelWrapPreview={rowLabelWrapPreview}
                                            labelSmallPreview={labelSmallPreview}
                                            rowControlWrapPreview={rowControlWrapPreview}
                                    />

                                    <PreviewStatRow
                                            label="Starting player"
                                            value={
                                                start === 'random' ? (
                                                        'Random'
                                                ) : (
                                                        <span
                                                                style={markInline}
                                                                aria-label={start}
                                                        >
                                                {start === 'O' ? (
                                                        <MarkO size={markSize} />
                                                ) : (
                                                        <MarkX size={markSize} />
                                                )}
                                            </span>
                                                )
                                            }
                                            rowLabelWrapPreview={rowLabelWrapPreview}
                                            labelSmallPreview={labelSmallPreview}
                                            rowControlWrapPreview={rowControlWrapPreview}
                                    />

                                    {mode === 'pve' && (
                                            <PreviewStatRow
                                                    label="Your symbol"
                                                    value={
                                                        <span
                                                                style={markInline}
                                                                aria-label={yourSymbol}
                                                        >
                                                {yourSymbol === 'O' ? (
                                                        <MarkO size={markSize} />
                                                ) : (
                                                        <MarkX size={markSize} />
                                                )}
                                            </span>
                                                    }
                                                    rowLabelWrapPreview={rowLabelWrapPreview}
                                                    labelSmallPreview={labelSmallPreview}
                                                    rowControlWrapPreview={
                                                        rowControlWrapPreview
                                                    }
                                            />
                                    )}

                                    <PreviewStatRow
                                            label="Timer"
                                            value={
                                                <span
                                                        style={
                                                            timerOn ? timerGreen : undefined
                                                        }
                                                >
                                            {timerLabel}
                                        </span>
                                            }
                                            rowLabelWrapPreview={rowLabelWrapPreview}
                                            labelSmallPreview={labelSmallPreview}
                                            rowControlWrapPreview={rowControlWrapPreview}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom toolbar: Play / Spectate / Back actions */}
                        <SettingsToolbar
                                style={buttonsRow}
                                onPlay={onPlay}
                                onSpectate={onSpectate}
                                onBack={() => nav(-1)}
                        />
                    </div>
                </UnderHeader>
            </div>
    );
}
