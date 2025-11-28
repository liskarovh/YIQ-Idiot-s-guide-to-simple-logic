import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {postCreateGame, getCapabilities, getMaxMines, getDetectPreset, persistLastCreate, persistGameplayPrefs, isAbortLikeError} from "../models/MinesweeperSettings/MinesweeperSettingsAPI.jsx";
import {buildCreatePayload, buildGameplayPrefs} from "../models/MinesweeperSettings/MinesweeperSettingsBuilders.jsx";
import {deriveInitialStateFromCaps} from "../models/MinesweeperSettings/MinesweeperSettingsState.jsx";

export function MinesweeperSettingsController() {
    const navigate = useNavigate();

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
    const [captureReplay, setCaptureReplay] = useState(true);

    // After default caps are loaded, we set the default settings state
    const initialCaps = useMemo(() => (caps ? deriveInitialStateFromCaps(caps) : null), [caps]);

    useEffect(() => {
        if(!initialCaps || !caps) {
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
        setCaptureReplay(!!caps.features?.replay);
    }, [initialCaps, caps]);

    const difficultyOptions = useMemo(() => (caps?.presets || []).map((p) => p.name).concat("Custom"), [caps?.presets]);
    const limits = useMemo(() => caps?.limits, [caps?.limits]);

    useEffect(() => {
        if(!caps) {
            return;
        }

        const abortCtrl = new AbortController();

        (async() => {
            try {
                const {view} = await getMaxMines(Number(rows),
                                                 Number(cols),
                                                 {signal: abortCtrl.signal});

                const value = typeof view === "number" ? view : view?.maxMines;
                setMaxMines(Number(value));
            }
            catch(e) {
                if(isAbortLikeError(e)) {
                    return;
                }
                setMaxMines(900); // safe fallback
            }
        })();

        return () => abortCtrl.abort();
    }, [rows, cols, caps]);

    // Detects preset definition by name
    const findPresetDims = useCallback(
            (name) => {
                if(!caps?.presets) {
                    return null;
                }
                return caps.presets.find((x) => x.name === name) || null;
            },
            [caps?.presets]
    );

    // Changes preset and updates dimensions accordingly
    const handleChangePreset = useCallback(
            (p) => {
                setPreset(p);
                if(p === "Custom") {
                    return; // do not change anything for "custom"
                }
                const presetDef = findPresetDims(p);
                if(presetDef) {
                    setRows(presetDef.rows);
                    setCols(presetDef.cols);
                    setMines(presetDef.mines);
                }
            },
            [findPresetDims]
    );

    // If the user changes dimensions manually, we try to detect the preset
    const detectPreviousDimsAndDetect = useRef(null); // to abort previous detect request and save network bandwidth
    const applyDimsAndDetect = useCallback(
            (nextRows, nextCols, nextMines) => {
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
                        const {view} = await getDetectPreset(Number(nextRows),
                                                             Number(nextCols),
                                                             Number(nextMines),
                                                             {signal: abortCtrl.signal});

                        const detected = typeof view === "string" ? view : view?.preset;
                        setPreset(detected);
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
            },
            []
    );

    // Handlers for safe state dimension changes
    const handleSetRows = useCallback(
            (v) => applyDimsAndDetect(Number(v), cols, mines),
            [applyDimsAndDetect, cols, mines]
    );
    const handleSetCols = useCallback(
            (v) => applyDimsAndDetect(rows, Number(v), mines),
            [applyDimsAndDetect, rows, mines]
    );
    const handleSetMines = useCallback(
            (v) => applyDimsAndDetect(rows, cols, Number(v)),
            [applyDimsAndDetect, rows, cols]
    );
    const handleLivesChange = useCallback(
            (v) => setLives(Number(v)),
            []
    );
    const handleShowTimerChange = useCallback(
            (v) => setShowTimer(!!v),
            []
    );
    const handleAllowUndoChange = useCallback(
            (v) => setAllowUndo(!!v),
            []
    );
    const handleEnableHintsChange = useCallback(
            (v) => setEnableHints(!!v),
            []
    );

    // Create game (after pressing play button)
    const detectPreviousCreateGame = useRef(null);
    const [submitError, setSubmitError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handlePlay = useCallback(async() => {
        setSubmitError(null);
        const abortCtrl = new AbortController();

        // Cancel previous request
        if(detectPreviousCreateGame.current) {
            detectPreviousCreateGame.current.abort();
        }

        detectPreviousCreateGame.current = abortCtrl;
        setSubmitting(true);

        try {
            const createPayload = buildCreatePayload({preset, rows, cols, mines, lives});

            const gameplayPrefs = buildGameplayPrefs({showTimer, allowUndo, enableHints, captureReplay});

            const {view, location} = await postCreateGame(createPayload,
                                                          {signal: abortCtrl.signal});

            // We save gameplay preferences and last create game payload
            if(view?.gameId) {
                persistGameplayPrefs(view.gameId, gameplayPrefs);
            }
            persistLastCreate(createPayload);

            // We try to use "location" header if present to navigate to the game
            if(location) {
                try {
                    const url = new URL(location, window.location.origin);
                    const gameId = view?.gameId || url.pathname.split("/").pop();
                    if(gameId) {
                        navigate("/minesweeper", {state: {id: gameId}});
                        return;
                    }
                }
                catch {
                    // ignore
                }
            }

            // Fallback navigation
            navigate("/minesweeper", {state: {id: view.gameId}});
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
    }, [navigate, preset, rows, cols, mines, lives, showTimer, allowUndo, enableHints, captureReplay]);

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
        captureReplay,

        // Capabilities
        limits,
        difficultyOptions,

        // Actions
        handleChangePreset,
        handleSetRows,
        handleSetCols,
        handleSetMines,
        handleLivesChange,
        handleShowTimerChange,
        handleAllowUndoChange,
        handleEnableHintsChange,
        handlePlay
    };
}
