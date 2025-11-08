import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import SettingRow from "../../components/SettingsRow";
import Slider from "../../components/Slider";
import NumberField from "../../components/NumberField";
import ToggleSwitch from "../../components/ToggleButton";
import Box from "../../components/Box";
import PlayButton from "../../components/PlayButton";
import ButtonSelect from "../../components/ButtonSelect";
import Header from "../../components/Header";
import AutoScale from "../../components/AutoScale";

import {createGame, persistUiPrefs, persistLastCreate} from "../models/MinesweeperSettings/MinesweeperSettingsAPI.jsx";
import {buildCreatePayload, buildUiPrefs} from "../models/MinesweeperSettings/MinesweeperSettingsBuilders.jsx";
import {presetMaps, difficultyOptions} from "../models/MinesweeperSettings/MinesweeperSettingsConstants.jsx";
import {detectPreset, calcMaxMines, clampMines} from "../models/MinesweeperSettings/MinesweeperSettingsLogic.jsx";
import MinesweeperSettingsStyles from "../styles/MinesweeperSettingsStyles.jsx";


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

    const [allowUndo, setAllowUndo] = useState(() => {
        console.log("[SettingsView] allowUndo initialized:", true);
        return true;
    });

    const [enableHints, setEnableHints] = useState(() => {
        console.log("[SettingsView] enableHints initialized:", false);
        return false;
    });

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
        const max = calcMaxMines(rows, cols);
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
    }, [cols, mines]);

    const safeSetCols = useCallback((newCols) => {
        console.log("[SettingsView] safeSetCols called:", newCols);
        setCols(newCols);

        const detected = detectPreset(rows, newCols, mines);
        console.log("[SettingsView] safeSetCols detected preset:", detected);
        setPreset(detected);
    }, [rows, mines]);

    const safeSetMines = useCallback((m) => {
        console.log("[SettingsView] safeSetMines called:", m);

        const clamped = clampMines(maxMines, Math.max(1, m));
        console.log("[SettingsView] safeSetMines clamped to:", clamped);

        setMines(clamped);

        const detected = detectPreset(rows, cols, clamped);
        console.log("[SettingsView] safeSetMines detected preset:", detected);

        setPreset(detected);
    }, [maxMines, rows, cols]);

    const handlePlay = useCallback(async() => {
        const createPayload = buildCreatePayload({ preset, rows, cols, mines, lives });
        console.log("[SettingsView] handlePlay createPayload:", createPayload);


        const uiPrefs = buildUiPrefs({ showTimer, allowUndo, enableHints });
        console.log("[SettingsView] handlePlay uiPrefs:", uiPrefs);

        try {
            console.log("[SettingsView] handlePlay fetching:", `${base}/game`);

            const view = await createGame(base, createPayload);
            console.log("[SettingsView] handlePlay game created:", view);
            console.log("[SettingsView] handlePlay gameId:", view.gameId);
            console.log("[SettingsView] handlePlay rows:", view.rows);
            console.log("[SettingsView] handlePlay cols:", view.cols);
            console.log("[SettingsView] handlePlay mines:", view.mines);
            console.log("[SettingsView] handlePlay board:", view.board);
            console.log("[SettingsView] handlePlay opened cells:", view.board?.opened?.length || 0);
            console.log("[SettingsView] handlePlay flagged cells:", view.board?.flagged?.length || 0);

            persistUiPrefs(view.gameId, uiPrefs);
            console.log("[SettingsView] handlePlay saved uiPrefs to localStorage");

            persistLastCreate(createPayload);
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
    }, [preset, rows, cols, mines, lives, showTimer, allowUndo, enableHints, navigate]);

    // Wrapper funkce pro toggle změny s logováním
    const handleShowTimerChange = useCallback((value) => {
        console.log("[SettingsView] showTimer changed to:", value);
        setShowTimer(value);
    }, []);

    const handleAllowUndoChange = useCallback((value) => {
        console.log("[SettingsView] allowUndo changed to:", value);
        setAllowUndo(value);
    }, []);

    const handleEnableHintsChange = useCallback((value) => {
        console.log("[SettingsView] enableHints changed to:", value);
        setEnableHints(value);
    }, []);

    const handleLivesChange = useCallback((value) => {
        console.log("[SettingsView] lives changed to:", value);
        setLives(value);
    }, []);


    return (
            <div style={MinesweeperSettingsStyles.contentStyle}>
                <Header
                        showBack={true}
                        onNavigate={() => navigate(-1)}
                />
                <div style={MinesweeperSettingsStyles.boxLayoutStyle}>
                    <AutoScale
                            baseWidth={MinesweeperSettingsStyles.boxAutoscaleWidth}
                            baseHeight={MinesweeperSettingsStyles.boxAutoscaleHeight}
                            maxScale={MinesweeperSettingsStyles.boxAutoscaleMaxScale}
                            minScale={MinesweeperSettingsStyles.boxAutoscaleMinScale}
                            center={MinesweeperSettingsStyles.boxAutoscaleCenter}
                    >
                        <Box width={MinesweeperSettingsStyles.boxWidth}
                             height={MinesweeperSettingsStyles.boxHeight}
                             style={MinesweeperSettingsStyles.boxStyle}
                             title="Game Basics"
                        >
                            <SettingRow
                                    label="Difficulty:"
                                    inline={MinesweeperSettingsStyles.settingsRowInline}
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
                                    inline={MinesweeperSettingsStyles.settingsRowInline}
                                    control={
                                        <div style={MinesweeperSettingsStyles.sliderAndNumberFieldStyle}>
                                            <Slider
                                                    min={3}
                                                    max={30}
                                                    value={rows}
                                                    onChange={safeSetRows}
                                                    width={MinesweeperSettingsStyles.sliderGameBasicsPanelWidth}
                                            />
                                            <NumberField
                                                    presetValue={rows}
                                                    onChange={safeSetRows}
                                                    minValue={3}
                                                    maxValue={30}
                                                    maxDigits={MinesweeperSettingsStyles.numberFieldMaxDigits}
                                            />
                                        </div>
                                    }
                            />
                            <SettingRow
                                    label="Columns:"
                                    inline={MinesweeperSettingsStyles.settingsRowInline}
                                    control={
                                        <div style={MinesweeperSettingsStyles.sliderAndNumberFieldStyle}>
                                            <Slider min={3}
                                                    max={30}
                                                    value={cols}
                                                    onChange={safeSetCols}
                                                    width={MinesweeperSettingsStyles.sliderGameBasicsPanelWidth}
                                            />
                                            <NumberField
                                                    presetValue={cols}
                                                    onChange={safeSetCols}
                                                    minValue={3}
                                                    maxValue={30}
                                                    maxDigits={MinesweeperSettingsStyles.numberFieldMaxDigits}
                                            />
                                        </div>
                                    }
                            />
                            <SettingRow
                                    label="Mines:"
                                    inline={MinesweeperSettingsStyles.settingsRowInline}
                                    control={
                                        <div style={MinesweeperSettingsStyles.sliderAndNumberFieldStyle}>
                                            <Slider min={1}
                                                    max={maxMines}
                                                    value={mines}
                                                    onChange={safeSetMines}
                                                    width={MinesweeperSettingsStyles.sliderGameBasicsPanelWidth}
                                            />
                                            <NumberField
                                                    presetValue={mines}
                                                    onChange={safeSetMines}
                                                    minValue={1}
                                                    maxValue={maxMines}
                                                    maxDigits={MinesweeperSettingsStyles.numberFieldMaxDigits}
                                            />
                                        </div>
                                    }
                            />
                        </Box>
                    </AutoScale>
                    <AutoScale
                            baseWidth={MinesweeperSettingsStyles.boxAutoscaleWidth}
                            baseHeight={MinesweeperSettingsStyles.boxAutoscaleHeight}
                            maxScale={MinesweeperSettingsStyles.boxAutoscaleMaxScale}
                            minScale={MinesweeperSettingsStyles.boxAutoscaleMinScale}
                            center={MinesweeperSettingsStyles.boxAutoscaleCenter}
                    >
                        <Box width={MinesweeperSettingsStyles.boxWidth}
                             height={MinesweeperSettingsStyles.boxHeight}
                             style={MinesweeperSettingsStyles.boxStyle}
                             title="Gameplay"
                        >
                            <SettingRow
                                    label="Number of Lives:"
                                    inline={MinesweeperSettingsStyles.settingsRowInline}
                                    control={
                                        <div style={MinesweeperSettingsStyles.sliderAndNumberFieldStyle}>
                                            <Slider min={0}
                                                    max={10}
                                                    value={lives}
                                                    onChange={handleLivesChange}
                                                    width={MinesweeperSettingsStyles.sliderGameplayPanelWidth}
                                            />
                                            <NumberField
                                                    presetValue={lives}
                                                    onChange={handleLivesChange}
                                                    minValue={0}
                                                    maxValue={10}
                                                    maxDigits={MinesweeperSettingsStyles.numberFieldMaxDigits}
                                                    zeroAsInfinity={true}
                                            />
                                        </div>
                                    }
                            />
                            <SettingRow
                                    label="Enable Timer:"
                                    inline={MinesweeperSettingsStyles.settingsRowInline}
                                    control={
                                        <div style={MinesweeperSettingsStyles.sliderAndNumberFieldStyle}>
                                            <ToggleSwitch
                                                    checked={showTimer}
                                                    onChange={handleShowTimerChange}
                                            />
                                        </div>
                                    }
                            />
                            <SettingRow
                                    label="Enable Undo(s):"
                                    inline={MinesweeperSettingsStyles.settingsRowInline}
                                    control={
                                        <div style={MinesweeperSettingsStyles.sliderAndNumberFieldStyle}>
                                            <ToggleSwitch
                                                    checked={allowUndo}
                                                    onChange={handleAllowUndoChange}
                                            />
                                        </div>
                                    }
                            />
                            <SettingRow
                                    label="Enable Hints:"
                                    inline={MinesweeperSettingsStyles.settingsRowInline}
                                    control={
                                        <div style={MinesweeperSettingsStyles.sliderAndNumberFieldStyle}>
                                            <ToggleSwitch
                                                    checked={enableHints}
                                                    onChange={handleEnableHintsChange}
                                            />
                                        </div>
                                    }
                            />
                        </Box>
                    </AutoScale>
                </div>

                <div style={MinesweeperSettingsStyles.footer}>
                    <PlayButton
                            onClick={handlePlay}
                    >Play</PlayButton>
                </div>
            </div>
    );
}


export default MinesweeperSettingsView;
