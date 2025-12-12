import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {getGame, postReveal, postFlag, postSetMode, postUndo, postSeek, postPreview, postRevive, getHint, isAbortLikeError} from "../models/MinesweeperGame/MinesweeperGameAPI.jsx";
import {postCreateGame} from "../models/MinesweeperSettings/MinesweeperSettingsAPI.jsx";
import {useGameTimer, useExplosionMode, useDerivedGameState} from "../hooks/MinesweeperGameHooks";
import {buildCreatePayload, buildGameplayPrefs} from "../models/MinesweeperSettings/MinesweeperSettingsBuilders";
import {normalizeView} from "../models/MinesweeperGame/MinesweeperGameRenderHelpers";
import {LAST_CREATE_PAYLOAD_KEY, LAST_GAMEPLAY_PREFS_KEY, SETTINGS_PAUSE_STORAGE_KEY} from "../models/MinesweeperStorageKeys";

export function useMinesweeperGameController() {
    const navigate = useNavigate();
    const location = useLocation();

    // First we extract the gameId from location state
    const gameId = location?.state?.id;

    // General States
    const [view, setView] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    // If gameId is missing, create a new game with a default preset and navigate here with the new id
    const detectPreviousCreateGame = useRef(null);
    useEffect(() => {
        if(gameId) {
            return;
        }

        (async() => {
            setError(null);
            const abortCtrl = new AbortController();

            if(detectPreviousCreateGame.current) {
                detectPreviousCreateGame.current.abort();
            }

            detectPreviousCreateGame.current = abortCtrl;

            try {
                // Create a new game with default settings
                const {view, location} = await postCreateGame({preset: "Medium", rows: 16, cols: 16, mines: 40, lives: 3},
                                                              {signal: abortCtrl.signal});
                const newGameId = view?.gameId;

                if(!newGameId) {
                    throw new Error("No gameId returned from server");
                }

                // Create defaults for persistence
                const gameplayPrefs = buildGameplayPrefs({
                                                             gameId: newGameId,
                                                             showTimer: true,
                                                             allowUndo: true,
                                                             enableHints: true
                                                         });
                const createPayload = buildCreatePayload({
                                                             gameId: newGameId,
                                                             preset: view?.preset || "Medium",
                                                             rows: view?.rows || 16,
                                                             cols: view?.cols || 16,
                                                             mines: view?.mines || 40,
                                                             lives: view.lives?.total || 3
                                                         });

                // Persist last used settings
                localStorage.setItem(LAST_GAMEPLAY_PREFS_KEY, JSON.stringify(gameplayPrefs));
                localStorage.setItem(LAST_CREATE_PAYLOAD_KEY, JSON.stringify(createPayload));

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
                setError(String(e?.message || e));
            }
            finally {
                detectPreviousCreateGame.current = null;
            }
        })();
    }, [gameId, navigate]);

    // Load Gameplay preferences from localStorage
    const gameplayPrefs = useMemo(() => {
        try {
            const rawPrefs = localStorage.getItem(LAST_GAMEPLAY_PREFS_KEY);
            return JSON.parse(rawPrefs || "{}");
        }
        catch {
            return {};
        }
    }, []);

    // On mount, check if we have a saved paused state in sessionStorage
    useEffect(() => {
        if(!gameId) {
            return;
        }
        try {
            const raw = sessionStorage.getItem(SETTINGS_PAUSE_STORAGE_KEY);
            if(!raw) {
                return;
            }
            const saved = JSON.parse(raw);
            if(saved?.gameId !== gameId) {
                return;
            }
            sessionStorage.removeItem(SETTINGS_PAUSE_STORAGE_KEY);
            if(typeof saved.wasPaused === "boolean") {
                setPaused(saved.wasPaused);
            }
        }
        catch {
            sessionStorage.removeItem(SETTINGS_PAUSE_STORAGE_KEY);
            setPaused(false);
        }
    }, [gameId]);

    // Gameplay preferences states
    const showTimer = gameplayPrefs.showTimer ?? true;
    const allowUndo = gameplayPrefs.allowUndo ?? true;
    const enableHints = gameplayPrefs.enableHints ?? true;
    const holdHighlight = gameplayPrefs.holdHighlight ?? true;

    // Game statistics and feature states
    const [hintsUsed, setHintsUsed] = useState(0);
    const [hintRectangle, setHintRectangle] = useState(null);
    const [highlightCell, setHighlightCell] = useState(null);
    const [seekIndex, setSeekIndex] = useState(0);

    // Game state states
    const [paused, setPaused] = useState(false);
    const [quickFlag, setQuickFlag] = useState(false);

    // Derived game states hooks
    const [explodedMode, setExplodedMode] = useExplosionMode(view);
    const derived = useDerivedGameState({view, paused, busy, explodedMode});
    const {beforeStart, isGameOver, isExploded, canReveal, canFlag, canUseActions, minesRemaining, permanentFlagsSet, hearts} = derived;
    const [timerSec, setTimerSec] = useGameTimer({view, showTimer, paused, isExploded: explodedMode, isGameOver});

    // Per-request AbortController set a hint timer
    const controllersRef = useRef(new Set());
    const hintTimerRef = useRef(null);

    // Load last used difficulty from localStorage
    const difficulty = useMemo(() => {
        try {
            const rawDifficulty = localStorage.getItem(LAST_CREATE_PAYLOAD_KEY);
            if(!rawDifficulty) {
                return null;
            }
            const currentPreset = JSON.parse(rawDifficulty);
            return currentPreset.preset || "Custom";
        }
        catch {
            return null;
        }
    }, []);

    // Loads game data on mount
    useEffect(() => {
        if(!gameId) {
            return;
        }

        const abortCtrl = new AbortController();
        const signal = abortCtrl.signal;

        (async() => {
            try {
                setError(null);
                const data = await getGame(gameId, {signal});

                // If the request was aborted, we do nothing
                if(signal.aborted) {
                    return;
                }

                // Normalize the data
                const normalizedData = normalizeView(data);
                if(!normalizedData) {
                    return;
                }

                // Else we update the state
                setView(normalizedData);
                setQuickFlag(!!normalizedData.quickFlag);
                setSeekIndex(normalizedData.cursor ?? 0);
                setTimerSec(normalizedData.elapsedTime ?? 0);
            }
            catch(e) {
                // Ignore abort-like errors
                if(isAbortLikeError(e)) {
                    return;
                }
                setError(String(e?.message || e));
            }
        })();

        return () => abortCtrl.abort();
    }, [setTimerSec, gameId]);

    // Helper to check if a cell is opened
    const isOpened = useCallback((row, col) => {
        return view?.board?.opened?.some((cell) => cell.row === row && cell.col === col);
    }, [view?.board?.opened]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Abort all ongoing requests
            controllersRef.current.forEach((abortCtrl) => abortCtrl.abort());
            controllersRef.current.clear();

            // Clear hint timer
            if(hintTimerRef.current) {
                clearTimeout(hintTimerRef.current);
                hintTimerRef.current = null;
            }
        };
    }, []);

    const applyViewPayload = useCallback((payload) => {
        if(!payload) {
            return false;
        }

        if(payload.board) {
            const normalizedData = normalizeView(payload);
            if(!normalizedData) {
                return false;
            }
            setView(normalizedData);
            setSeekIndex(normalizedData.cursor ?? 0);
            setQuickFlag(!!normalizedData.quickFlag);
            return true;
        }

        setView((prev) => (prev ? {...prev, ...payload} : prev));
        if(Object.prototype.hasOwnProperty.call(payload, "quickFlagEnabled")) {
            setQuickFlag(!!payload.quickFlagEnabled);
        }
        return true;
    }, []);

    // Safe setter for view that checks for abort signal
    const safeSetView = useCallback((data, signal) => {
        // Ignore if aborted or no data
        if(signal && signal.aborted) {
            return;
        }

        // Update the view state
        const payload = data?.view ?? data;
        return applyViewPayload(payload);
    }, [applyViewPayload]);

    // Request wrapper that applies view automatically
    const wrapRequest = useCallback(async(apiFunction) => {
            const abortCtrl = new AbortController();
            controllersRef.current.add(abortCtrl);
            const signal = abortCtrl.signal;

            setBusy(true);
            setError(null);

            // Execute the API function and update the view
            try {
                const data = await apiFunction({signal});

                // If aborted, do nothing
                if(signal.aborted) {
                    return null;
                }

                // Update the view safely
                safeSetView(data, signal);
                return data;
            }
            catch(e) {
                if(isAbortLikeError(e)) {
                    return null;
                }

                setError(String(e?.message || e));
                throw e;
            }
            finally {
                controllersRef.current.delete(abortCtrl);
                if(!signal.aborted) {
                    setBusy(false);
                }
            }
    }, [safeSetView]);

    // Wapper that doesn't auto-apply view (for small utils like getHint, ...)
    const wrapRequestNoUpdate = useCallback(async(apiFunction) => {
        const ctrl = new AbortController();
        controllersRef.current.add(ctrl);
        const signal = ctrl.signal;

        setBusy(true);
        setError(null);

        try {
            const data = await apiFunction({signal});
            if(signal.aborted) {
                return null;
            }
            return data;
        }
        catch(e) {
            if(isAbortLikeError(e)) {
                return null;
            }
            setError(String(e?.message || e));
            throw e;
        }
        finally {
            controllersRef.current.delete(ctrl);
            if(!signal.aborted) {
                setBusy(false);
            }
        }
    }, []);

    // Action handlers
    const doReveal = useCallback(async(row, col) => {
        if(!view || !canReveal) {
            return;
        }

        await wrapRequest((opts) => postReveal(gameId, row, col, opts));
    }, [wrapRequest, gameId, view, canReveal]);

    const doFlag = useCallback(async(row, col, set) => {
        if(!view || !canFlag) {
            return;
        }

        await wrapRequest((opts) => postFlag(gameId, row, col, set, opts));
    }, [wrapRequest, gameId, view, canFlag]);

    // TODO: implement doMoveFlag properly
    const doMoveFlag = useCallback(async(fromRow, fromCol, toRow, toCol) => {
        if(!view || !canFlag) {
            return;
        }
        await wrapRequest(async(opts) => {
            await postFlag(gameId, fromRow, fromCol, false, opts);
            return postFlag(gameId, toRow, toCol, true, opts);
        });
    }, [wrapRequest, gameId, view, canFlag]);

    const doQuickFlagMode = useCallback(async() => {
        if(!view || !canUseActions) {
            return;
        }

        try {
            const result = await wrapRequest((opts) => postSetMode(gameId, !quickFlag, opts));
            if(result) {
                const quickFlagEnabled = result?.view?.quickFlagEnabled ?? result?.quickFlagEnabled;
                if(typeof quickFlagEnabled === "boolean") {
                    setQuickFlag(quickFlagEnabled);
                }
            }
        }
        catch {
            // Error already set in wrapper
        }
    }, [wrapRequest, gameId, quickFlag, view, canUseActions]);

    const doUndo = useCallback(async() => {
        if(!allowUndo || !view || (view.cursor ?? 0) === 0 || !canUseActions) {
            return;
        }

        await wrapRequest((opts) => postUndo(gameId, 1, opts));
    }, [wrapRequest, allowUndo, gameId, view, canUseActions]);


    const [hintCooldown, setHintCooldown] = useState(false);
    const doHint = useCallback(async() => {
        if(!enableHints || !view || !canUseActions || hintCooldown) {
            return;
        }

        setHintCooldown(true);

        try {
            const data = await wrapRequestNoUpdate((opts) => getHint(gameId, opts));
            if(!data) {
                setHintCooldown(false);
                return;
            }
            if(data?.type === "mine-area") {
                setHintRectangle(data.hintRectangle);
                setHintsUsed((hintsTotal) => (hintsTotal + 1));

                // Clear any existing timer
                if(hintTimerRef.current) {
                    clearTimeout(hintTimerRef.current);
                }

                hintTimerRef.current = setTimeout(() => {
                    hintTimerRef.current = null;
                    setHintRectangle(null);
                    setHintCooldown(false);
                }, 5000);
            }
            else {
                setHintCooldown(false);
            }
        }
        catch {
            setHintCooldown(false);
        }
    }, [wrapRequestNoUpdate, gameId, view, canUseActions, hintCooldown, enableHints]);


    const doUndoAndRevive = useCallback(async() => {
        if(!view || paused || busy) {
            return;
        }
        const result = await wrapRequest((opts) => postRevive(gameId, undefined, opts));
        if(result) {
            setExplodedMode(false);
        }
    }, [wrapRequest, gameId, paused, busy, view, setExplodedMode]);

    const doReviveFromMove = useCallback(async() => {
        if(!view || paused || busy) {
            return;
        }
        const result = await wrapRequest((opts) => postRevive(gameId, seekIndex, opts));
        if(result) {
            setExplodedMode(false);
        }
    }, [wrapRequest, gameId, seekIndex, paused, busy, view, setExplodedMode]);

    const handleSliderChange = useCallback(async(v) => {
        if(busy) {
            return;
        }

        const endpoint = isExploded || isGameOver ? "preview" : "seek";

        try {
            await wrapRequest((opts) => endpoint === "preview"
                                        ? postPreview(gameId, v, opts)
                                        : postSeek(gameId, v, opts)
            );

            if(endpoint === "preview") {
                setSeekIndex(v);
            }
        }
        catch {
            // Error handled in wrapper
        }
    }, [wrapRequest, gameId, isExploded, isGameOver, busy]);

    const handleBeginHold = useCallback((row, col) => {
        if(holdHighlight && isOpened(row, col)) {
            setHighlightCell({row, col});
        }
    }, [isOpened, holdHighlight]);

    const handleEndHold = useCallback(() => {
        setHighlightCell(null);
    }, []);

    const onSettings = useCallback(() => {
        const wasPaused = paused;
        if(!paused) {
            setPaused(true);
        }

        try {
            sessionStorage.setItem(SETTINGS_PAUSE_STORAGE_KEY, JSON.stringify({gameId, wasPaused}));
        }
        catch {
            // ignore
        }

        navigate("/minesweeper/settings", {
            state: {
                existingGameId: gameId,
                fromGame: true
            }
        });
    }, [gameId, paused, navigate]);

    return {
        view,
        busy,
        error,
        showTimer,
        allowUndo,
        enableHints,
        holdHighlight,

        paused,
        setPaused,
        hintRectangle,
        hintsUsed,
        seekIndex,
        quickFlag,
        highlightCell,
        isExploded,
        beforeStart,
        isGameOver,
        timerSec,
        hintCooldown,

        hearts,
        difficulty,
        minesRemaining,
        permanentFlagsSet,
        canReveal,
        canFlag,
        canUseActions,

        doReveal,
        doFlag,
        doMoveFlag,
        toggleQuickFlag: doQuickFlagMode,
        doUndo,
        doHint,
        doUndoAndRevive,
        doReviveFromMove,
        handleSliderChange,
        handleBeginHold,
        handleEndHold,
        onSettings
    };
}
