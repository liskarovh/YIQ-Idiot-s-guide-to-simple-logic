import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {createGame, getCapabilities, getMaxMines, detectPreset, persistLastCreate, persistUiPrefs} from "../models/MinesweeperSettings/MinesweeperSettingsAPI.jsx";
import {buildCreatePayload, buildUiPrefs} from "../models/MinesweeperSettings/MinesweeperSettingsBuilders.jsx";
import {deriveInitialStateFromCaps} from "../models/MinesweeperSettings/MinesweeperSettingsState.jsx";

function uuid4() {
    return crypto?.randomUUID
           ? crypto.randomUUID()
           : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useMinesweeperSettingsController() {
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const base = `${apiUrl}/api/minesweeper`;

    // --- Capabilities lifecycle ---
    const [caps, setCaps] = useState(null);
    const [capsLoading, setCapsLoading] = useState(true);

    useEffect(() => {
        const ac = new AbortController();
        (async() => {
            try {
                setCapsLoading(true);
                const c = await getCapabilities(base, {signal: ac.signal});
                setCaps(c);
            }
            catch(e) {
                console.debug("[MinesweeperSettingsController] CapsError", e);
            }
            finally {
                setCapsLoading(false);
            }
        })();
        return () => ac.abort();
    }, [base]);

    // --- Inputs, initialized from capabilities ---
    const init = useMemo(() => (caps ? deriveInitialStateFromCaps(caps) : null), [caps]);

    const [preset, setPreset] = useState("Medium");
    const [rows, setRows] = useState(16);
    const [cols, setCols] = useState(16);
    const [mines, setMines] = useState(40);
    const [lives, setLives] = useState(3);

    // UI-only volby (neposílají se do create payloadu kromě quickFlag pokud ho tak máš)
    const [showTimer, setShowTimer] = useState(true);
    const [allowUndo, setAllowUndo] = useState(true);
    const [enableHints, setEnableHints] = useState(true);

    // Po načtení capabilities nastavíme výchozí stav (bez FE kanonizace; to dělá server)
    useEffect(() => {
        if(!init || !caps) {
            return;
        }

        setPreset(init.preset);
        setRows(init.rows);
        setCols(init.cols);
        setMines(init.mines);
        setLives(3);

        // features z capabilities
        setAllowUndo(!!caps.features?.undo);
        setEnableHints(!!caps.features?.hints);
    }, [init, caps]);

    const difficultyOptions = useMemo(() => (caps?.presets || []).map((p) => p.name).concat("Custom"), [caps?.presets]);
    const limits = useMemo(() => caps?.limits, [caps?.limits]);
    const [maxMines, setMaxMines] = useState(null);
    const maxMinesInflightRef = useRef(null);
    useEffect(() => {
        if(!caps) {
            return;
        }

        const ac = new AbortController();

        // cancel previous request
        if(maxMinesInflightRef.current) {
            maxMinesInflightRef.current.abort();
        }
        maxMinesInflightRef.current = ac;

        (async() => {
            try {
                const idk = uuid4();
                const payload = {rows: Number(rows), cols: Number(cols)};

                const {view} = await getMaxMines(base, payload, {
                    signal: ac.signal,
                    idempotencyKey: idk
                });

                const value = typeof view === "number" ? view : view?.maxMines;
                setMaxMines(Number(value));
            }
            catch(e) {
                if(e?.name === "AbortError") {
                    return;
                }
                console.debug("[MinesweeperSettingsController] getMaxMines error", e);
                setMaxMines(900); // safe fallback
            }
            finally {
                maxMinesInflightRef.current = null;
            }
        })();

        return () => ac.abort();
    }, [rows, cols, base, caps]);

    // --- Helpers ---
    const findPresetDims = useCallback(
            (name) => {
                if(!caps?.presets) {
                    return null;
                }
                return caps.presets.find((x) => x.name === name) || null;
            },
            [caps?.presets]
    );

    // --- Handlery ---
    const changePreset = useCallback(
            (p) => {
                setPreset(p);
                if(p === "Custom") {
                    // necháme aktuální rows/cols/mines beze změny
                    return;
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

    // Pokud uživatel mění rozměry, je to Custom; pokud se přesně trefí do presetu, detekujeme ho zpět.
    const detectInflightRef = useRef(null);
    const applyDimsAndDetect = useCallback(
            (nextRows, nextCols, nextMines) => {
                setRows(nextRows);
                setCols(nextCols);
                setMines(nextMines);

                // Cancel previous detect request
                if(detectInflightRef.current) {
                    detectInflightRef.current.abort();
                }

                const ac = new AbortController();
                detectInflightRef.current = ac;

                (async() => {
                    try {
                        const idk = uuid4();
                        const payload = {
                            rows: Number(nextRows),
                            cols: Number(nextCols),
                            mines: Number(nextMines)
                        };

                        const {view} = await detectPreset(base, payload, {
                            signal: ac.signal,
                            idempotencyKey: idk
                        });

                        const detected = typeof view === "string" ? view : view?.preset;
                        console.log(detected);
                        setPreset(detected);
                    }
                    catch(e) {
                        if(e?.name === "AbortError") {
                            return;
                        }
                        console.debug("[MinesweeperSettingsController] detectPreset error", e);
                        setPreset("Custom"); // fallback
                    }
                    finally {
                        detectInflightRef.current = null;
                    }
                })();
            },
            []
    );

    const safeSetRows = useCallback(
            (v) => applyDimsAndDetect(Number(v), cols, mines),
            [applyDimsAndDetect, cols, mines]
    );
    const safeSetCols = useCallback(
            (v) => applyDimsAndDetect(rows, Number(v), mines),
            [applyDimsAndDetect, rows, mines]
    );
    const safeSetMines = useCallback(
            (v) => applyDimsAndDetect(rows, cols, Number(v)),
            [applyDimsAndDetect, rows, cols]
    );

    const handleLivesChange = useCallback((v) => setLives(Number(v)), []);
    const handleShowTimerChange = useCallback((v) => setShowTimer(!!v), []);
    const handleAllowUndoChange = useCallback((v) => setAllowUndo(!!v), []);
    const handleEnableHintsChange = useCallback((v) => setEnableHints(!!v), []);

    // --- Idempotent create + abort previous inflight ---
    const inflightRef = useRef(null);
    const [submitError, setSubmitError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handlePlay = useCallback(async() => {
        setSubmitError(null);
        const ac = new AbortController();

        // cancel previous request
        if(inflightRef.current) {
            inflightRef.current.abort();
        }

        inflightRef.current = ac;
        setSubmitting(true);
        try {
            const idk = uuid4();

            const createPayload = buildCreatePayload({
                                                         preset,
                                                         rows,
                                                         cols,
                                                         mines,
                                                         lives
                                                     });

            const uiPrefs = buildUiPrefs({
                                             showTimer,
                                             allowUndo,
                                             enableHints
                                         });

            const {view, location} = await createGame(base, createPayload, {
                signal: ac.signal,
                idempotencyKey: idk
            });

            // uložit UI prefs a „poslední vytvoření“
            if(view?.gameId) {
                persistUiPrefs(view.gameId, uiPrefs);
            }
            persistLastCreate(createPayload);

            // Prefer Location header, pokud je k dispozici
            if(location) {
                try {
                    const url = new URL(location, window.location.origin);
                    const id = view?.gameId || url.pathname.split("/").pop();
                    if(id) {
                        navigate(`/minesweeper/play/${id}`);
                        return;
                    }
                }
                catch {
                    // padající/relativní Location – ignorujeme a použijeme body
                }
            }

            // fallback – použij ID z těla
            navigate(`/minesweeper/play/${view.gameId}`);
        }
        catch(e) {
            if(e?.name === "AbortError") {
                return;
            } // ignore aborted
            setSubmitError(e);
        }
        finally {
            setSubmitting(false);
            inflightRef.current = null;
        }
    }, [preset, rows, cols, mines, lives, showTimer, allowUndo, enableHints, navigate]);

    return {
        // data
        loaded: !!init && !!caps && !capsLoading,
        loading: capsLoading,
        error: submitError,
        submitting,

        preset,
        rows,
        cols,
        mines,
        maxMines,
        lives,

        showTimer,
        allowUndo,
        enableHints,

        limits,
        difficultyOptions,

        // actions
        changePreset,
        safeSetRows,
        safeSetCols,
        safeSetMines,
        handleLivesChange,
        handleShowTimerChange,
        handleAllowUndoChange,
        handleEnableHintsChange,
        handlePlay
    };
}
