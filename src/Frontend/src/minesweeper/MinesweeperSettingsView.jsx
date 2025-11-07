import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import colors from "../Colors";
import SettingRow from "../components/SettingsRow";
import Slider from "../components/Slider";
import NumberField from "../components/NumberField";
import ToggleSwitch from "../components/ToggleButton";
import Box from "../components/Box";
import PlayButton from "../components/PlayButton";
import ButtonSelect from "../components/ButtonSelect";
import Header from "../components/Header";

const presetMaps = {
    Easy: {rows: 9, cols: 9, mines: 10},
    Medium: {rows: 16, cols: 16, mines: 40},
    Hard: {rows: 16, cols: 30, mines: 99}
};

const difficultyOptions = ["Easy", "Medium", "Hard", "Custom"];

function MinesweeperSettingsView({initial = {}}) {
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const base = `${apiUrl}/api/minesweeper`;

    console.log("[SettingsView] Component mounted");
    console.log("[SettingsView] API base URL:", base);
    console.log("[SettingsView] Initial props:", initial);

    // Základní hodnoty
    const [preset, setPreset] = useState(() => {
        const p = initial.preset ?? "Medium";
        console.log("[SettingsView] Initial preset:", p);
        return p;
    });

    const [rows, setRows] = useState(() => {
        const r = initial.rows ?? presetMaps[preset]?.rows;
        console.log("[SettingsView] Initial rows:", r);
        return r;
    });

    const [cols, setCols] = useState(() => {
        const c = initial.cols ?? presetMaps[preset]?.cols;
        console.log("[SettingsView] Initial cols:", c);
        return c;
    });

    const [mines, setMines] = useState(() => {
        const m = initial.mines ?? presetMaps[preset]?.mines;
        console.log("[SettingsView] Initial mines:", m);
        return m;
    });

    const [lives, setLives] = useState(() => {
        const l = initial.lives ?? 3;
        console.log("[SettingsView] Initial lives:", l);
        return l;
    });

    // Gameplay UI preference
    const [showTimer, setShowTimer] = useState(() => {
        console.log("[SettingsView] showTimer initialized:", true);
        return true;
    });

    const [captureReplay, setCaptureReplay] = useState(() => {
        console.log("[SettingsView] captureReplay initialized:", true);
        return true;
    });

    const [allowUndo, setAllowUndo] = useState(() => {
        console.log("[SettingsView] allowUndo initialized:", true);
        return true;
    });

    const [enableHints, setEnableHints] = useState(() => {
        console.log("[SettingsView] enableHints initialized:", false);
        return false;
    });

    const [holdHighlight, setHoldHighlight] = useState(() => {
        console.log("[SettingsView] holdHighlight initialized:", true);
        return true;
    });

    const [quickFlag, setQuickFlag] = useState(() => {
        const qf = initial.quickFlagEnabled ?? false;
        console.log("[SettingsView] quickFlag initialized:", qf);
        return qf;
    });

    // Detekce presetu na základě konfigurace
    const detectPreset = useCallback((r, c, m) => {
        console.log("[SettingsView] detectPreset called with:", {rows: r, cols: c, mines: m});

        for(const [presetName, config] of Object.entries(presetMaps)) {
            if(config.rows === r && config.cols === c && config.mines === m) {
                console.log("[SettingsView] detectPreset found match:", presetName);
                return presetName;
            }
        }

        console.log("[SettingsView] detectPreset no match, using Custom");
        return "Custom";
    }, []);

    // Přepnutí presetu
    const changePreset = useCallback((p) => {
        console.log("[SettingsView] changePreset called:", p);
        setPreset(p);

        if(p !== "Custom" && presetMaps[p]) {
            const v = presetMaps[p];
            console.log("[SettingsView] changePreset applying config:", v);
            setRows(v.rows);
            setCols(v.cols);
            setMines(v.mines);
        }
    }, []);

    // Konzistence: upper bound/mines
    const maxMines = useMemo(() => {
        const max = Math.max(1, (rows - 1) * (cols - 1));
        console.log("[SettingsView] maxMines calculated:", max, "from", rows, "x", cols);
        return max;
    }, [rows, cols]);

    // Při změně maxMines, zkontroluj a uprav aktuální hodnotu min
    useEffect(() => {
        if(mines > maxMines) {
            console.log("[SettingsView] Clamping mines from", mines, "to", maxMines);
            setMines(maxMines);
        }
    }, [maxMines, mines]);

    const safeSetRows = useCallback((newRows) => {
        console.log("[SettingsView] safeSetRows called:", newRows);
        setRows(newRows);

        const detected = detectPreset(newRows, cols, mines);
        console.log("[SettingsView] safeSetRows detected preset:", detected);
        setPreset(detected);
    }, [cols, mines, detectPreset]);

    const safeSetCols = useCallback((newCols) => {
        console.log("[SettingsView] safeSetCols called:", newCols);
        setCols(newCols);

        const detected = detectPreset(rows, newCols, mines);
        console.log("[SettingsView] safeSetCols detected preset:", detected);
        setPreset(detected);
    }, [rows, mines, detectPreset]);

    const safeSetMines = useCallback((m) => {
        console.log("[SettingsView] safeSetMines called:", m);
        const clamped = Math.min(maxMines, Math.max(1, m));
        console.log("[SettingsView] safeSetMines clamped to:", clamped);
        setMines(clamped);

        const detected = detectPreset(rows, cols, clamped);
        console.log("[SettingsView] safeSetMines detected preset:", detected);
        setPreset(detected);
    }, [maxMines, rows, cols, detectPreset]);

    const handlePlay = useCallback(async() => {
        console.log("[SettingsView] handlePlay called");

        const createPayload = preset === "Custom"
                              ? {rows, cols, mines, lives, quickFlag, firstClickNoGuess: true}
                              : {preset, lives, quickFlag, firstClickNoGuess: true};

        console.log("[SettingsView] handlePlay createPayload:", createPayload);

        const uiPrefs = {
            showTimer,
            captureReplay,
            allowUndo,
            enableHints,
            holdHighlight
        };

        console.log("[SettingsView] handlePlay uiPrefs:", uiPrefs);

        try {
            console.log("[SettingsView] handlePlay fetching:", `${base}/game`);

            const res = await fetch(`${base}/game`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(createPayload)
            });

            console.log("[SettingsView] handlePlay response status:", res.status);

            if(!res.ok) {
                const error = await res.json().catch(() => ({error: `HTTP ${res.status}`}));
                console.error("[SettingsView] handlePlay error response:", error);
                throw new Error(error?.error || `HTTP ${res.status}`);
            }

            const view = await res.json();
            console.log("[SettingsView] handlePlay game created:", view);
            console.log("[SettingsView] handlePlay gameId:", view.gameId);
            console.log("[SettingsView] handlePlay rows:", view.rows);
            console.log("[SettingsView] handlePlay cols:", view.cols);
            console.log("[SettingsView] handlePlay mines:", view.mines);
            console.log("[SettingsView] handlePlay board:", view.board);
            console.log("[SettingsView] handlePlay opened cells:", view.board?.opened?.length || 0);
            console.log("[SettingsView] handlePlay flagged cells:", view.board?.flagged?.length || 0);

            localStorage.setItem(`ms:uiPrefs:${view.gameId}`, JSON.stringify(uiPrefs));
            console.log("[SettingsView] handlePlay saved uiPrefs to localStorage");

            localStorage.setItem("ms:lastCreate", JSON.stringify(createPayload));
            console.log("[SettingsView] handlePlay saved lastCreate to localStorage");

            console.log("[SettingsView] handlePlay navigating to:", `/minesweeper/play/${view.gameId}`);
            navigate(`/minesweeper/play/${view.gameId}`);
        }
        catch(e) {
            console.error("[SettingsView] handlePlay exception:", e);
            console.error("[SettingsView] handlePlay exception message:", e.message);
            console.error("[SettingsView] handlePlay exception stack:", e.stack);
            alert(`Failed to start game: ${e.message}`);
        }
    }, [preset, rows, cols, mines, lives, showTimer, captureReplay, allowUndo, enableHints, holdHighlight, quickFlag, navigate]);

    // Wrapper funkce pro toggle změny s logováním
    const handleShowTimerChange = useCallback((value) => {
        console.log("[SettingsView] showTimer changed to:", value);
        setShowTimer(value);
    }, []);

    const handleCaptureReplayChange = useCallback((value) => {
        console.log("[SettingsView] captureReplay changed to:", value);
        setCaptureReplay(value);
    }, []);

    const handleAllowUndoChange = useCallback((value) => {
        console.log("[SettingsView] allowUndo changed to:", value);
        setAllowUndo(value);
    }, []);

    const handleEnableHintsChange = useCallback((value) => {
        console.log("[SettingsView] enableHints changed to:", value);
        setEnableHints(value);
    }, []);

    const handleHoldHighlightChange = useCallback((value) => {
        console.log("[SettingsView] holdHighlight changed to:", value);
        setHoldHighlight(value);
    }, []);

    const handleLivesChange = useCallback((value) => {
        console.log("[SettingsView] lives changed to:", value);
        setLives(value);
    }, []);

    // Layouty
    const boxWidth = "650px";
    const boxHeight = "450px";

    const boxStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "1.75rem"
    };

    const boxLayoutStyle = {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        textAlign: "center",
        padding: "2rem 2rem",
        gap: "4rem"
    };

    const contentStyle = {
        padding: "5rem 2rem 2rem 2rem"
    };

    const sliderAndNumberFieldStyle = {
        display: "flex",
        alignItems: "center",
        gap: 12
    };

    const footer = {
        display: "flex",
        justifyContent: "center",
        marginTop: 26,
        width: "100%"
    };

    console.log("[SettingsView] Rendering with state:", {
        preset, rows, cols, mines, lives, maxMines,
        showTimer, captureReplay, allowUndo, enableHints, holdHighlight, quickFlag
    });

    return (
            <div style={contentStyle}>
                <Header
                        showBack={true}
                        onNavigate={() => navigate(-1)}
                />
                <div style={boxLayoutStyle}>
                    {/* LEFT: Game Basics */}
                    <Box width={boxWidth}
                         height={boxHeight}
                         title="Game Basics"
                         style={boxStyle}
                    >
                        <SettingRow
                                label="Difficulty:"
                                inline={true}
                                control={
                                        <ButtonSelect
                                                options={difficultyOptions}
                                                selected={preset}
                                                onChange={changePreset}
                                        />
                                }
                        />
                        <SettingRow
                                label="Rows:"
                                inline={true}
                                control={
                                    <div style={sliderAndNumberFieldStyle}>
                                        <Slider
                                                min={3}
                                                max={30}
                                                value={rows}
                                                onChange={safeSetRows}
                                                width={295}
                                        />
                                        <NumberField
                                                presetValue={rows}
                                                onChange={safeSetRows}
                                                minValue={3}
                                                maxValue={30}
                                                maxDigits={3}
                                        />
                                    </div>
                                }
                        />
                        <SettingRow
                                label="Columns:"
                                inline={true}
                                control={
                                    <div style={sliderAndNumberFieldStyle}>
                                        <Slider min={3}
                                                max={30}
                                                value={cols}
                                                onChange={safeSetCols}
                                                width={295}
                                        />
                                        <NumberField
                                                presetValue={cols}
                                                onChange={safeSetCols}
                                                minValue={3}
                                                maxValue={30}
                                                maxDigits={3}
                                        />
                                    </div>
                                }
                        />
                        <SettingRow
                                label="Mines:"
                                inline={true}
                                control={
                                    <div style={sliderAndNumberFieldStyle}>
                                        <Slider min={1}
                                                max={maxMines}
                                                value={mines}
                                                onChange={safeSetMines}
                                                width={295}
                                        />
                                        <NumberField
                                                presetValue={mines}
                                                onChange={safeSetMines}
                                                minValue={1}
                                                maxValue={maxMines}
                                                maxDigits={3}
                                        />
                                    </div>
                                }
                        />
                    </Box>

                    {/* RIGHT: Gameplay */}
                    <Box width={boxWidth}
                         height={boxHeight}
                         title="Gameplay"
                         style={boxStyle}
                    >
                        <SettingRow
                                label="Number of Lives:"
                                inline={true}
                                control={
                                    <div style={sliderAndNumberFieldStyle}>
                                        <Slider min={0}
                                                max={10}
                                                value={lives}
                                                onChange={handleLivesChange}
                                                width={240}
                                        />
                                        <NumberField
                                                presetValue={lives}
                                                onChange={handleLivesChange}
                                                minValue={0}
                                                maxValue={10}
                                                maxDigits={3}
                                                zeroAsInfinity={true}
                                        />
                                    </div>
                                }
                        />
                        <SettingRow
                                label="Enable Timer:"
                                inline={true}
                                control={
                                    <div style={sliderAndNumberFieldStyle}>
                                        <ToggleSwitch
                                                checked={showTimer}
                                                onChange={handleShowTimerChange}
                                        />
                                    </div>
                                }
                        />
                        <SettingRow
                                label="Enable Undo(s):"
                                inline={true}
                                control={
                                    <div style={sliderAndNumberFieldStyle}>
                                        <ToggleSwitch
                                                checked={allowUndo}
                                                onChange={handleAllowUndoChange}
                                        />
                                    </div>
                                }
                        />
                        <SettingRow
                                label="Enable Hints:"
                                inline={true}
                                control={
                                    <div style={sliderAndNumberFieldStyle}>
                                        <ToggleSwitch
                                                checked={enableHints}
                                                onChange={handleEnableHintsChange}
                                        />
                                    </div>
                                }
                        />
                    </Box>
                </div>
                <div style={footer}>
                    <PlayButton
                            onClick={handlePlay}
                    >Play</PlayButton>
                </div>
            </div>
    );
}

export default MinesweeperSettingsView;
