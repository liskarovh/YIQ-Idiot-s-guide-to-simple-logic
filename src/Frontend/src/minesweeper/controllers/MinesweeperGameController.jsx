/**
 * @file MinesweeperGameController.jsx
 * @brief A custom React hook that manages the state and actions of a Minesweeper game.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {getGame, postReveal, postFlag, postSetMode, postUndo, postSeek, postPreview, postRevive, getHint, isAbortLikeError, getResume, postPause} from "../models/MinesweeperGame/MinesweeperGameAPI.jsx";
import {postCreateGame} from "../models/MinesweeperSettings/MinesweeperSettingsAPI.jsx";
import {useGameTimer, useExplosionMode, useDerivedGameState} from "../hooks/MinesweeperGameHooks";
import {buildCreatePayload, buildGameplayPrefs} from "../models/MinesweeperSettings/MinesweeperSettingsBuilders";
import {normalizeView} from "../models/MinesweeperGame/MinesweeperGameRenderHelpers";
import {LAST_CREATE_PAYLOAD_KEY, LAST_GAMEPLAY_PREFS_KEY, SETTINGS_PAUSE_STORAGE_KEY} from "../models/MinesweeperStorageKeys";
import {flushSync} from "react-dom";

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
            const raw = localStorage.getItem(SETTINGS_PAUSE_STORAGE_KEY);
            if(!raw) {
                return;
            }
            const saved = JSON.parse(raw);
            if(saved?.gameId !== gameId) {
                return;
            }
            localStorage.removeItem(SETTINGS_PAUSE_STORAGE_KEY);
            if(typeof saved.wasPaused === "boolean") {
                setPaused(saved.wasPaused);
            }
        }
        catch {
            localStorage.removeItem(SETTINGS_PAUSE_STORAGE_KEY);
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

    useEffect(() => {
        if(!gameId) {
            return;
        }

        const sendPause = () => {
            if(paused) {
                return;
            }

            const url = `/game/${gameId}/pause`;

            try {
                // Fetch with keepalive (GET)
                if(window.fetch) {
                    void fetch(url, {method: "GET", keepalive: true, credentials: "same-origin"}).catch(() => { /* ignore */ });
                    return;
                }

                // We also try sendBeacon as a fallback (POST)
                if(navigator.sendBeacon) {
                    const blob = new Blob([], {type: "text/plain;charset=UTF-8"});
                    navigator.sendBeacon(url, blob);
                }
            }
            catch {
                // ignore
            }
        };

        window.addEventListener("beforeunload", sendPause);
        window.addEventListener("pagehide", sendPause);

        return () => {
            window.removeEventListener("beforeunload", sendPause);
            window.removeEventListener("pagehide", sendPause);
        };
    }, [gameId, paused]);

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

    // Effect to handle pause/resume side-effects
    const pauseSentRef = useRef(null);
    useEffect(() => {
        if(!gameId) {
            return;
        }

        // We skip for the first render
        if(view && view?.status === "new") {
            pauseSentRef.current = paused;
            return;
        }

        // Avoid duplicate requests
        if(pauseSentRef.current === paused) {
            return;
        }
        pauseSentRef.current = paused;

        // We call the appropriate API
        paused ? postPause(gameId, timerSec) : getResume(gameId);
    }, [paused, gameId]);

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

        // Force synchronous state update before navigation
        flushSync(() => {
            if(!paused) {
                setPaused(true);
            }
        });

        try {
            localStorage.setItem(SETTINGS_PAUSE_STORAGE_KEY, JSON.stringify({gameId, wasPaused}));
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

    const onStrategy = useCallback(() => {
        const wasPaused = paused;

        flushSync(() => {
            if(!paused) {
                setPaused(true);
            }
        });

        try {
            localStorage.setItem(SETTINGS_PAUSE_STORAGE_KEY, JSON.stringify({gameId, wasPaused}));
        }
        catch {
            // ignore
        }

        navigate("/minesweeper/strategy", {
            state: {
                existingGameId: gameId,
                fromGame: true
            }
        });
    }, [gameId, paused, navigate]);

    // Play Again handler
    const onPlayAgain = useCallback(async() => {
        setError(null);
        const abortCtrl = new AbortController();

        // Cancel previous create if any
        if(detectPreviousCreateGame.current) {
            try {
                detectPreviousCreateGame.current.abort();
            }
            catch {
                // ignore
            }
        }

        detectPreviousCreateGame.current = abortCtrl;
        setBusy(true);

        try {
            // Load last used create payload and prefs
            let lastCreate = null;
            try {
                lastCreate = JSON.parse(localStorage.getItem(LAST_CREATE_PAYLOAD_KEY));
            }
            catch {
                lastCreate = null;
            }

            let lastPrefs = null;
            try {
                lastPrefs = JSON.parse(localStorage.getItem(LAST_GAMEPLAY_PREFS_KEY));
            }
            catch {
                lastPrefs = null;
            }

            // Build payload using last used or current view settings
            const payload = {
                preset: lastCreate?.preset ?? view?.preset ?? "Custom",
                rows: Number(lastCreate?.rows ?? view?.rows ?? 16),
                cols: Number(lastCreate?.cols ?? view?.cols ?? 16),
                mines: Number(lastCreate?.mines ?? view?.mines ?? 40),
                lives: Number(lastCreate?.lives ?? (view?.lives?.total ?? 3))
            };

            // Build prefs using last used or current prefs
            const prefs = {
                showTimer: lastPrefs?.showTimer ?? gameplayPrefs.showTimer ?? true,
                allowUndo: lastPrefs?.allowUndo ?? gameplayPrefs.allowUndo ?? true,
                enableHints: lastPrefs?.enableHints ?? gameplayPrefs.enableHints ?? true
            };

            // Create the new game
            const result = await postCreateGame(payload, {signal: abortCtrl.signal});

            if(!result || !result.view) {
                throw new Error("No game view returned from server");
            }

            // Apply new view locally
            const newView = normalizeView(result.view);
            if(newView) {
                setView(newView);
                setQuickFlag(!!newView.quickFlag);
                setSeekIndex(newView.cursor ?? 0);
                setTimerSec(newView.elapsedTime ?? 0);
            }

            // Extract new gameId
            const newGameId = result.view?.gameId;

            // Persist last used settings
            try {
                localStorage.setItem(LAST_GAMEPLAY_PREFS_KEY, JSON.stringify(buildGameplayPrefs({gameId: newGameId, ...prefs})));
                localStorage.setItem(LAST_CREATE_PAYLOAD_KEY, JSON.stringify(buildCreatePayload({gameId: newGameId, ...payload})));
            }
            catch {
                // ignore
            }

            // Navigate to the new game using "location" header if present
            const locationHeader = result.location;
            if(locationHeader) {
                try {
                    const url = new URL(locationHeader, window.location.origin);
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
            if(isAbortLikeError(e)) {
                return;
            }
            setError(String(e?.message || e));
        }
        finally {
            detectPreviousCreateGame.current = null;
            setBusy(false);
        }
    }, [navigate, view, gameplayPrefs, normalizeView, setView, setQuickFlag, setSeekIndex, setTimerSec]);

    // Keyboard navigation state
    const [focusedCell, setFocusedCell] = useState(null);
    const [keyboardActive, setKeyboardActive] = useState(false);
    const [keyboardDragging, setKeyboardDragging] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(null); // {x,y} in pixels
    const keyboardHostRef = useRef(null);

    // Click outside handler to disable keyboard navigation
    useEffect(() => {
        const handleClickOutside = (event) => {
            const host = keyboardHostRef.current;
            if(host && !host.contains(event.target)) {
                setKeyboardActive(false);
                setFocusedCell(null);
                handleEndHold();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleEndHold]);

    // Handler to drop flag at cursor position
    const dropFlagAtCursor = useCallback(() => {
        if(!cursorPosition) {
            return false;
        }

        const cols = view?.cols;
        const rows = view?.rows;

        if(!cols || !rows) {
            return false;
        }

        const gridElement = keyboardHostRef.current?.querySelector("[style*=\"grid-template-columns\"]");
        if(!gridElement) {
            return false;
        }

        const rect = gridElement.getBoundingClientRect();
        const cellWidthScaled = rect.width / cols;
        const cellHeightScaled = rect.height / rows;

        let col = Math.floor(cursorPosition.x / cellWidthScaled);
        let row = Math.floor(cursorPosition.y / cellHeightScaled);

        col = Math.max(0, Math.min(cols - 1, col));
        row = Math.max(0, Math.min(rows - 1, row));

        const key = `${row},${col}`;
        const isOpen = view?.board?.opened?.some(c => c.row === row && c.col === col);
        const isPermaFlagged = permanentFlagsSet.has(key);
        const lostOnCell = !!(view?.board?.lostOn && view.board.lostOn.row === row && view.board.lostOn.col === col);

        const isFlaggable = !isOpen && !paused && !isPermaFlagged &&
                            !lostOnCell && !beforeStart;

        if(isFlaggable) {
            void doFlag(row, col, true);
            return true;
        }

        return false;
    }, [cursorPosition, keyboardHostRef, view?.cols, view?.rows, view?.board?.opened, view?.board?.lostOn,
        permanentFlagsSet, paused, beforeStart, doFlag]);

    // Keyboard handler
    const handleKeyDown = useCallback((event) => {
        if(!view) {
            return;
        }

        // Only process allowed keys
        const allowedKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
                             "Enter", " ", "d", "D", "f", "F", "q", "Q",
                             "h", "H", "p", "P", "u", "U", "t", "T",
                             "Escape", "Home", "End"];
        if(!allowedKeys.includes(event.key)) {
            return;
        }

        // Allow keyboard navigation before game starts
        const allowKeyboard = canUseActions || beforeStart || event.key === "p" || event.key === "P" || event.key === "Escape";
        if(!allowKeyboard) {
            return;
        }

        const rows = view.rows;
        const cols = view.cols;
        let handled = false;

        // Helper to clamp values
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

        if(event.key !== "p" && event.key !== "P" && event.key !== "Escape") {

            // Arrow keys require keyboard mode to be active
            const isArrowKey = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key);
            if(isArrowKey && !keyboardActive) {
                setKeyboardActive(true);

                const row = Math.floor(rows / 2);
                const col = Math.floor(cols / 2);

                setFocusedCell({row, col});

                event.preventDefault();
                event.stopPropagation();
                return;
            }

            // For non-arrow keys, activate keyboard mode but continue with action
            if(!keyboardActive) {
                setKeyboardActive(true);

                const row = Math.floor(rows / 2);
                const col = Math.floor(cols / 2);

                setFocusedCell({row, col});

                event.preventDefault();
                event.stopPropagation();
            }
        }
        // Determine current focused cell
        const currentCell = focusedCell ?? {row: Math.floor(rows / 2), col: Math.floor(cols / 2)};

        // Helper to move focus
        const moveTo = (nextRow, nextCol) => {
            nextRow = clamp(nextRow, 0, rows - 1);
            nextCol = clamp(nextCol, 0, cols - 1);

            if(nextRow === currentCell.row && nextCol === currentCell.col) {
                return;
            }

            handleEndHold();
            setFocusedCell({row: nextRow, col: nextCol});
        };

        // Handle key actions
        switch(event.key) {
            case "ArrowUp":
                if(keyboardDragging && cursorPosition) {
                    setCursorPosition(prev => {
                        const gridRect = keyboardHostRef.current?.querySelector("[style*=\"gridTemplateColumns\"]")?.getBoundingClientRect();
                        const maxY = gridRect?.height || 1000;
                        return {
                            x: prev.x,
                            y: Math.max(0, Math.min(prev.y - 15, maxY))
                        };
                    });
                }
                else {
                    moveTo(currentCell.row - 1, currentCell.col);
                }
                handled = true;
                break;
            case "ArrowDown":
                if(keyboardDragging && cursorPosition) {
                    setCursorPosition(prev => {
                        const gridRect = keyboardHostRef.current?.querySelector("[style*=\"gridTemplateColumns\"]")?.getBoundingClientRect();
                        const maxY = gridRect?.height || 1000;
                        return {
                            x: prev.x,
                            y: Math.max(0, Math.min(prev.y + 15, maxY))
                        };
                    });
                }
                else {
                    moveTo(currentCell.row + 1, currentCell.col);
                }
                handled = true;
                break;
            case "ArrowLeft":
                if(keyboardDragging && cursorPosition) {
                    setCursorPosition(prev => {
                        const gridRect = keyboardHostRef.current?.querySelector("[style*=\"gridTemplateColumns\"]")?.getBoundingClientRect();
                        const maxX = gridRect?.width || 1000;
                        return {
                            x: Math.max(0, Math.min(prev.x - 15, maxX)),
                            y: prev.y
                        };
                    });
                }
                else {
                    moveTo(currentCell.row, currentCell.col - 1);
                }
                handled = true;
                break;
            case "ArrowRight":
                if(keyboardDragging && cursorPosition) {
                    setCursorPosition(prev => {
                        const gridRect = keyboardHostRef.current?.querySelector("[style*=\"gridTemplateColumns\"]")?.getBoundingClientRect();
                        const maxX = gridRect?.width || 1000;
                        return {
                            x: Math.max(0, Math.min(prev.x + 15, maxX)),
                            y: prev.y
                        };
                    });
                }
                else {
                    moveTo(currentCell.row, currentCell.col + 1);
                }
                handled = true;
                break;
            case "d":
            case "D":
                if(keyboardDragging) {
                    dropFlagAtCursor();
                    setKeyboardDragging(false);
                    setCursorPosition(null);
                    handled = true;
                }
                else if(!beforeStart) {
                    setKeyboardDragging(true);

                    if(!focusedCell) {
                        const row = Math.floor(rows / 2);
                        const col = Math.floor(cols / 2);
                        setFocusedCell({row, col});
                    }

                    setCursorPosition(null);
                    handled = true;
                }
                break;
            case "Enter":
            case " ":
                if(keyboardDragging && cursorPosition) {
                    dropFlagAtCursor();
                    setKeyboardDragging(false);
                    setCursorPosition(null);
                    handled = true;
                    break;
                }

                if(focusedCell) {
                    if(quickFlag) {
                        if(isOpened(focusedCell.row, focusedCell.col) || permanentFlagsSet.has(`${focusedCell.row},${focusedCell.col}`)) {
                            break;
                        }
                        const isFlagged = view.board?.flagged?.some(cell => cell.row === focusedCell.row && cell.col === focusedCell.col);
                        void doFlag(focusedCell.row, focusedCell.col, !isFlagged);
                    }
                    else {
                        void doReveal(focusedCell.row, focusedCell.col);
                    }
                    handled = true;
                }
                break;
            case "f":
            case "F":
                if(focusedCell) {
                    if(isOpened(focusedCell.row, focusedCell.col) || permanentFlagsSet.has(`${focusedCell.row},${focusedCell.col}`)) {
                        break;
                    }
                    const isFlagged = view.board?.flagged?.some(cell => cell.row === focusedCell.row && cell.col === focusedCell.col);
                    void doFlag(focusedCell.row, focusedCell.col, !isFlagged);
                    handled = true;
                }
                break;
            case "q":
            case "Q":
                void doQuickFlagMode();
                handled = true;
                break;
            case "h":
            case "H":
                void doHint();
                handled = true;
                break;
            case "p":
            case "P":
                setPaused(!paused);
                handled = true;
                break;
            case "u":
            case "U":
                void doUndo();
                handled = true;
                break;
            case "t":
            case "T":
                if(holdHighlight && focusedCell && isOpened(focusedCell.row, focusedCell.col)) {
                    if(event.type === "keydown" && !event.repeat) {
                        setHighlightCell(focusedCell);
                    }
                }
                handled = true;
                break;
            case "Escape":
                handleEndHold();
                setKeyboardActive(false);
                setFocusedCell(null);
                setKeyboardDragging(false);
                setCursorPosition(null);
                handled = true;
                break;
            case "Home":
                moveTo(0, 0);
                handled = true;
                break;
            case "End":
                moveTo(rows - 1, cols - 1);
                handled = true;
                break;
            default:
                break;
        }

        if(handled) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, [view, canUseActions, beforeStart, focusedCell, keyboardActive, keyboardDragging,
        cursorPosition, quickFlag, handleEndHold, doFlag, doReveal, doQuickFlagMode,
        doHint, paused, doUndo, keyboardHostRef, permanentFlagsSet, dropFlagAtCursor]);

    // Handler to release highlight on "t" key up
    useEffect(() => {
        const handleKeyUp = (event) => {
            if((event.key === "t" || event.key === "T") && highlightCell) {
                setHighlightCell(null);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, [handleKeyDown, highlightCell]);

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
        doQuickFlagMode,
        doUndo,
        doHint,
        doUndoAndRevive,
        doReviveFromMove,
        handleSliderChange,
        handleBeginHold,
        handleEndHold,

        // Routing
        onSettings,
        onStrategy,
        onPlayAgain,

        // Keyboard navigation
        focusedCell: keyboardActive ? focusedCell : null,
        keyboardDragging: keyboardActive ? keyboardDragging : false,
        cursorPosition: keyboardActive ? cursorPosition : null,
        setCursorPosition,
        onDropFlag: doFlag,
        handleKeyDown,
        keyboardHostRef
    };
}
