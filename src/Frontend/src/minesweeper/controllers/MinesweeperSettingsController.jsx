import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {postCreateGame, getCapabilities, getMaxMines, getDetectPreset, persistLastCreatePayload, persistLastGameplayPrefs, isAbortLikeError} from "../models/MinesweeperSettings/MinesweeperSettingsAPI";
import {buildCreatePayload, buildGameplayPrefs} from "../models/MinesweeperSettings/MinesweeperSettingsBuilders";
import {deriveInitialStateFromCaps} from "../models/MinesweeperSettings/MinesweeperSettingsState";
import {LAST_CREATE_PAYLOAD_KEY, LAST_GAMEPLAY_PREFS_KEY} from "../models/MinesweeperStorageKeys";

export function MinesweeperSettingsController() {
    const navigate = useNavigate();
    const location = useLocation();

    // Settings passed from location state (if any)
    const existingGameId = location?.state?.existingGameId;
    const fromGame = location?.state?.fromGame;

    // Track original values to detect changes
    const originalValues = useRef(null);
    const [changesDetected, setChangesDetected] = useState(null);

    // Lifecycle of Capabilities
    const [caps, setCaps] = useState(null);
    const [capsLoading, setCapsLoading] = useState(true);

    useEffect(() => {
        const abortCtrl = new AbortController();
        (async() => {
            try {
                setCapsLoading(true);
                const caps = await getCapabilities({signal: abortCtrl.signal});
                setCaps(caps);
            }
            catch(e) {
                if(isAbortLikeError(e)) {
                    return;
                }
                setCaps(null);
            }
            finally {
                setCapsLoading(false);
            }
        })();
        return () => abortCtrl.abort();
    }, []);

    // Prepare states for capabilities with default values (before caps are loaded from BE)
    const [preset, setPreset] = useState("Medium");
    const [rows, setRows] = useState(16);
    const [cols, setCols] = useState(16);
    const [mines, setMines] = useState(40);
    const [maxMines, setMaxMines] = useState(null);
    const [lives, setLives] = useState(3);

    const [showTimer, setShowTimer] = useState(true);
    const [allowUndo, setAllowUndo] = useState(true);
    const [enableHints, setEnableHints] = useState(true);

    // After default caps are loaded, we set the default settings state
    const initialCaps = useMemo(() => (caps ? deriveInitialStateFromCaps(caps) : null), [caps]);
    const difficultyOptions = useMemo(() => (caps?.presets || []).map((preset) => preset.name).concat("Custom"), [caps?.presets]);
    const limits = useMemo(() => caps?.limits, [caps?.limits]);

    // Detects preset definition by name
    const findPresetDims = useCallback((name) => {
        if(!caps?.presets) {
            return null;
        }
        return caps.presets.find((x) => x.name === name) || null;
    }, [caps?.presets]);

    // Load existing game preferences if coming from an existing game
    useEffect(() => {
        if(!existingGameId || capsLoading) {
            return;
        }

        try {
            const lastGameplayPrefs = localStorage.getItem(LAST_GAMEPLAY_PREFS_KEY);
            const lastCreatePayload = localStorage.getItem(LAST_CREATE_PAYLOAD_KEY);

            if(lastGameplayPrefs) {
                const parsed = JSON.parse(lastGameplayPrefs);

                setShowTimer(parsed.showTimer ?? true);
                setAllowUndo(parsed.allowUndo ?? true);
                setEnableHints(parsed.enableHints ?? true);
            }

            if(lastCreatePayload) {
                const parsed = JSON.parse(lastCreatePayload);

                if(parsed.gameId === existingGameId) {
                    let newPreset, newRows, newCols, newMines, newLives;

                    if(parsed.preset && parsed.preset !== "Custom") {
                        const presetDef = findPresetDims(parsed.preset);

                        if(presetDef) {
                            newPreset = parsed.preset;
                            newRows = presetDef.rows;
                            newCols = presetDef.cols;
                            newMines = presetDef.mines;
                            newLives = parsed.lives;
                        }
                    } else {
                        newPreset = "Custom";
                        newRows = parsed.rows;
                        newCols = parsed.cols;
                        newMines = parsed.mines;
                        newLives = parsed.lives;
                    }

                    // Snaphsot to avoid undefined issues in comparison below
                    const snapshot = {
                        preset: newPreset ?? parsed.preset ?? preset,
                        rows: Number(newRows ?? parsed.rows ?? rows),
                        cols: Number(newCols ?? parsed.cols ?? cols),
                        mines: Number(newMines ?? parsed.mines ?? mines),
                        lives: Number(newLives ?? parsed.lives ?? lives)
                    };

                    setPreset(snapshot.preset);
                    setRows(snapshot.rows);
                    setCols(snapshot.cols);
                    setMines(snapshot.mines);
                    setLives(snapshot.lives);

                    if(fromGame && originalValues.current == null) {
                        originalValues.current = snapshot;
                    }
                }
            }
        }
        catch {
            // ignore
        }
    }, [findPresetDims, existingGameId, capsLoading, fromGame]);

    // Detect changes compared to original values
    useEffect(() => {
        if(!fromGame || !originalValues.current) {
            setChangesDetected(null);
            return;
        }

        // Check if custom dimensions changed
        let customDimsChanged;
        if((originalValues.current.preset === "Custom") && (preset === "Custom")) {
            customDimsChanged =
                    originalValues.current.rows !== rows ||
                    originalValues.current.cols !== cols ||
                    originalValues.current.mines !== mines;
        }
        else {
            customDimsChanged = false;
        }

        const hasChanges =
                originalValues.current.lives !== lives ||
                originalValues.current.preset !== preset ||
                customDimsChanged;

        setChangesDetected(hasChanges ? "⚠️ Changing the board dimensions or the number of mines will result in the loss of the game in progress" : null);
    }, [preset, rows, cols, mines, lives, fromGame]);

    // Load initial capabilities if not already loaded or not coming from existing game
    useEffect(() => {
        if(!initialCaps || !caps || existingGameId) {
            return;
        }

        setPreset(initialCaps.preset);
        setRows(initialCaps.rows);
        setCols(initialCaps.cols);
        setMines(initialCaps.mines);
        setLives(initialCaps.lives);

        setShowTimer(!!caps.features?.timer);
        setAllowUndo(!!caps.features?.undo);
        setEnableHints(!!caps.features?.hints);
    }, [initialCaps, caps, existingGameId]);

    useEffect(() => {
        if(!caps) {
            return;
        }

        const abortCtrl = new AbortController();

        (async() => {
            try {
                const response = await getMaxMines(Number(rows),
                                                   Number(cols),
                                                   {signal: abortCtrl.signal});

                const maxMines = typeof response === "number" ? response : Number(response);
                setMaxMines(Number(maxMines));
            }
            catch(e) {
                if(isAbortLikeError(e)) {
                    return;
                }
                setMaxMines(900);
            }
        })();

        return () => abortCtrl.abort();
    }, [rows, cols, caps]);

    // Changes preset and updates dimensions accordingly
    const handleChangePreset = useCallback((preset) => {
        setPreset(preset);
        if(preset === "Custom") {
            return; // do not change anything for "custom"
        }
        const presetDef = findPresetDims(preset);
        if(presetDef) {
            setRows(presetDef.rows);
            setCols(presetDef.cols);
            setMines(presetDef.mines);
        }
    }, [findPresetDims]);

    // If the user changes dimensions manually, we try to detect the preset
    const detectPreviousDimsAndDetect = useRef(null); // to abort previous detect request and save network bandwidth
    const applyDimsAndDetect = useCallback((nextRows, nextCols, nextMines) => {
        setRows(nextRows);
        setCols(nextCols);
        setMines(nextMines);

        // Cancel previous detected request
        if(detectPreviousDimsAndDetect.current) {
            detectPreviousDimsAndDetect.current.abort();
        }

        const abortCtrl = new AbortController();
        detectPreviousDimsAndDetect.current = abortCtrl;

        (async() => {
            try {
                const response = await getDetectPreset(Number(nextRows),
                                                       Number(nextCols),
                                                       Number(nextMines),
                                                       {signal: abortCtrl.signal});

                const detectedPreset = typeof response === "string" ? response : String(response);
                setPreset(detectedPreset);
            }
            catch(e) {
                if(isAbortLikeError(e)) {
                    return;
                }
                setPreset("Custom"); // fallback
            }
            finally {
                detectPreviousDimsAndDetect.current = null;
            }
        })();
    }, []);

    // Handlers for safe state dimension changes
    const handleSetRows = useCallback((v) => {
        applyDimsAndDetect(Number(v), cols, mines);
    }, [applyDimsAndDetect, cols, mines]);

    const handleSetCols = useCallback((v) => {
        applyDimsAndDetect(rows, Number(v), mines);
    }, [applyDimsAndDetect, rows, mines]);

    const handleSetMines = useCallback((mines) => {
        applyDimsAndDetect(rows, cols, Number(mines));
    }, [applyDimsAndDetect, rows, cols]);

    const handleLivesChange = useCallback((lives) => {
        setLives(Number(lives));
    }, []);

    const handleShowTimerChange = useCallback((showTimer) => {
        setShowTimer(!!showTimer);
    }, []);

    const handleAllowUndoChange = useCallback((allowUndo) => {
        setAllowUndo(!!allowUndo);
    }, []);

    const handleEnableHintsChange = useCallback((enableHints) => {
        setEnableHints(!!enableHints);
    }, []);

    // Create game (after pressing play button)
    const detectPreviousCreateGame = useRef(null);
    const [submitError, setSubmitError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const onPlay = useCallback(async() => {
        // If coming from existing game and no changes detected, just navigate back
        if(fromGame && !changesDetected) {
            navigate("/minesweeper", {state: {id: existingGameId}});
            return;
        }

        // Check for changes if coming from existing game
        if(fromGame && changesDetected) {
            const confirmed = window.confirm(
                    "Changing the board dimensions or the number of mines will result in the loss of the game in progress. Do you want to continue?"
            );

            if(!confirmed) {
                return;
            }
        }

        setSubmitError(null);
        const abortCtrl = new AbortController();

        // Cancel previous request
        if(detectPreviousCreateGame.current) {
            detectPreviousCreateGame.current.abort();
        }

        detectPreviousCreateGame.current = abortCtrl;
        setSubmitting(true);

        // Create new game
        try {
            const {view, location} = await postCreateGame({preset, rows, cols, mines, lives},
                                                          {signal: abortCtrl.signal});
            const newGameId = view?.gameId;

            if(!newGameId) {
                throw new Error("No gameId returned from server");
            }

            // We save gameplay preferences and last create game payload
            persistLastGameplayPrefs(buildGameplayPrefs({gameId: newGameId, showTimer, allowUndo, enableHints}));
            persistLastCreatePayload(buildCreatePayload({gameId: newGameId, preset, rows, cols, mines, lives}));

            // We try to use "location" header if present to navigate to the game
            if(location) {
                try {
                    const url = new URL(location, window.location.origin);
                    const extractedId = url.pathname.split("/").pop();

                    if(extractedId) {
                        navigate("/minesweeper", {state: {id: extractedId}});
                        return;
                    }
                }
                catch {
                    // ignore
                }
            }

            // Fallback navigation
            navigate("/minesweeper", {state: {id: newGameId}});
        }
        catch(e) {
            // Ignore aborted
            if(isAbortLikeError(e)) {
                return;
            }

            // Else, set error
            setSubmitError(e);
        }
        finally {
            setSubmitting(false);
            detectPreviousCreateGame.current = null;
        }
    }, [navigate, preset, rows, cols, mines, lives, showTimer, allowUndo, enableHints, fromGame, changesDetected, existingGameId]);

    const onBack = useCallback(() => {
        if(fromGame) {
            void onPlay();
            return;
        }
        navigate("/", {replace: true});
    }, [fromGame, onPlay, navigate]);

    return {
        // General states
        capsLoading,
        submitError,
        submitting,

        // Game Basics settings
        preset,
        rows,
        cols,
        mines,
        maxMines,
        lives,

        // Gameplay settings
        showTimer,
        allowUndo,
        enableHints,

        // Capabilities
        limits,
        difficultyOptions,

        // Incoming from game
        fromGame,
        changesDetected,

        // Actions
        handleChangePreset,
        handleSetRows,
        handleSetCols,
        handleSetMines,
        handleLivesChange,
        handleShowTimerChange,
        handleAllowUndoChange,
        handleEnableHintsChange,

        // Navigation
        onPlay,
        onBack
    };
}
