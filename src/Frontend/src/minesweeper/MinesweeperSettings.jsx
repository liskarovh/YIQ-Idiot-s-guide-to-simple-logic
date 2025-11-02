import React, { useMemo, useState } from 'react';
import colors from '../Colors';
import SettingRow from '../components/SettingsRow';
import Slider from '../components/Slider';
import NumberField from '../components/NumberField';
import ToggleSwitch from '../components/ToggleButton';
import PanelCard from '../components/SettingsCard';
import PlayButton from '../components/PlayButton';
import SettingsOptionButton from "../components/SettingsOptionButton";

const Envelope = (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 5h18v14H3z" stroke="white" opacity="0.9"/>
            <path d="M3 6l9 7 9-7" stroke="white" opacity="0.9"/>
        </svg>
);

/**
 * MinesweeperSettings — složí UI z dříve vytvořených komponent.
 * Props:
 * - initial?: { preset?: 'Easy'|'Medium'|'Hard'|'Custom', rows?:number, cols?:number, mines?:number, lives?:number, quickFlag?:boolean }
 * - onSubmit?: (createPayload, uiPrefs) => void
 */
function MinesweeperSettings({ initial = {}, onSubmit }) {
    const [preset, setPreset] = useState(initial.preset ?? 'Medium');

    // Preset mapy dle backendu
    const presetMap = {
        Easy:   { rows: 9,  cols: 9,  mines: 10 },
        Medium: { rows: 16, cols: 16, mines: 40 },
        Hard:   { rows: 16, cols: 30, mines: 99 },
    };

    // Základní hodnoty
    const [rows, setRows]   = useState(initial.rows   ?? presetMap[preset]?.rows  ?? 16);
    const [cols, setCols]   = useState(initial.cols   ?? presetMap[preset]?.cols  ?? 16);
    const [mines, setMines] = useState(initial.mines  ?? presetMap[preset]?.mines ?? 40);
    const [lives, setLives] = useState(initial.lives  ?? 5);

    // Gameplay UI preference
    const [showTimer, setShowTimer]         = useState(true);
    const [captureReplay, setCaptureReplay] = useState(true);
    const [allowUndo, setAllowUndo]         = useState(true);
    const [enableHints, setEnableHints]     = useState(false);
    const [holdHighlight, setHoldHighlight] = useState(true);
    const [quickFlag, setQuickFlag]         = useState(initial.quickFlag ?? false);

    // Přepnutí presetu
    function changePreset(p) {
        setPreset(p);
        if (p !== 'Custom') {
            const v = presetMap[p];
            setRows(v.rows); setCols(v.cols); setMines(v.mines);
        }
    }

    // Konzistence: upper bound/mines
    const maxMines = useMemo(() => Math.max(0, rows * cols - 1), [rows, cols]);
    const safeSetMines = (m) => setMines(Math.min(maxMines, Math.max(0, m)));

    // Layouty
    const page = { padding: '24px', color: colors.text };
    const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 };
    const footer = { display: 'flex', justifyContent: 'center', marginTop: 26 };
    const labelStyle = { minWidth: 140, display: 'inline-block', fontWeight: 700, color: colors.text_header };

    // Submit -> payload pro backend + UI prefs
    function handlePlay() {
        let createPayload;
        if (preset === 'Custom') {
            createPayload = {
                rows, cols, mines,
                lives,
                quickFlag,
                firstClickNoGuess: true,
            };
        } else {
            createPayload = {
                preset, // 'Easy' | 'Medium' | 'Hard'
                lives,
                quickFlag,
                firstClickNoGuess: true,
            };
        }

        const uiPrefs = { showTimer, captureReplay, allowUndo, enableHints, holdHighlight };
        onSubmit && onSubmit(createPayload, uiPrefs);
    }

    return (
            <div style={page}>
                <div style={grid}>
                    {/* LEFT: Game Basics */}
                    <PanelCard title="Game Basics">
                        <SettingRow
                                label={<span style={labelStyle}>Difficulty:</span>}
                                control={
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        {['Easy','Medium','Hard','Custom'].map((opt) => (
                                                <SettingsOptionButton
                                                        key={opt}
                                                        selected={preset === opt}
                                                        onClick={() => changePreset(opt)}
                                                >
                                                    {opt}
                                                </SettingsOptionButton>
                                        ))}
                                    </div>
                                }
                        />

                        <div style={{ height: 12 }} />
                        <SettingRow
                                label={<span style={labelStyle}>Rows:</span>}
                                control={
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <Slider min={5} max={60} value={rows} onChange={setRows} width={320} />
                                        <NumberField value={rows} onChange={setRows} min={5} max={60} icon={Envelope} />
                                    </div>
                                }
                        />

                        <div style={{ height: 12 }} />
                        <SettingRow
                                label={<span style={labelStyle}>Columns:</span>}
                                control={
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <Slider min={5} max={60} value={cols} onChange={setCols} width={320} />
                                        <NumberField value={cols} onChange={setCols} min={5} max={60} icon={Envelope} />
                                    </div>
                                }
                        />

                        <div style={{ height: 12 }} />
                        <SettingRow
                                label={<span style={labelStyle}>Mines:</span>}
                                control={
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <Slider min={1} max={maxMines} value={mines} onChange={safeSetMines} width={320} />
                                        <NumberField value={mines} onChange={safeSetMines} min={1} max={maxMines} icon={Envelope} />
                                    </div>
                                }
                        />
                    </PanelCard>

                    {/* RIGHT: Gameplay */}
                    <PanelCard title="Gameplay">
                        <SettingRow
                                label={<span style={labelStyle}>Number of Lives:</span>}
                                control={
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <Slider min={0} max={99} value={lives} onChange={setLives} width={320} />
                                        <NumberField value={lives} onChange={setLives} min={0} max={999} icon={Envelope} />
                                    </div>
                                }
                        />

                        <div style={{ height: 12 }} />
                        <SettingRow
                                label={<span style={labelStyle}>Show Timer:</span>}
                                control={<ToggleSwitch checked={showTimer} onChange={setShowTimer} />}
                        />

                        <div style={{ height: 12 }} />
                        <SettingRow
                                label={<span style={labelStyle}>Capture Replay:</span>}
                                control={<ToggleSwitch checked={captureReplay} onChange={setCaptureReplay} />}
                        />

                        <div style={{ height: 12 }} />
                        <SettingRow
                                label={<span style={labelStyle}>Undo Last Move(s):</span>}
                                control={<ToggleSwitch checked={allowUndo} onChange={setAllowUndo} />}
                        />

                        <div style={{ height: 12 }} />
                        <SettingRow
                                label={<span style={labelStyle}>Enable Hints:</span>}
                                control={<ToggleSwitch checked={enableHints} onChange={setEnableHints} />}
                        />

                        <div style={{ height: 12 }} />
                        <SettingRow
                                label={<span style={labelStyle}>Hold to Highlight Neighbouring Cells:</span>}
                                control={<ToggleSwitch checked={holdHighlight} onChange={setHoldHighlight} />}
                        />

                        <div style={{ height: 12 }} />
                        <SettingRow
                                label={<span style={labelStyle}>Quick Flag Mode:</span>}
                                control={<ToggleSwitch checked={quickFlag} onChange={setQuickFlag} />}
                        />
                    </PanelCard>
                </div>

                <div style={footer}>
                    <PlayButton onClick={handlePlay}>Play</PlayButton>
                </div>
            </div>
    );
}

export default MinesweeperSettings;
