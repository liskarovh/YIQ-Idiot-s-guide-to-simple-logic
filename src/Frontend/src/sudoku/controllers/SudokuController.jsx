/**
 * @file SudokuController.jsx
 * @brief Controller module responsible for managing the initial setup, loading, and automatic saving (autosave) of the Sudoku game state by communicating with the backend API.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { fetchState, sendState } from '../models/ServerCommunicationModel';
import { useGrid } from '../models/GridModel';
import { useGameInfo } from '../models/GameInfoModel';
import { useGameOptions } from '../models/SettingsModel';
import { useHistory } from '../models/HistoryModel';
import { mapGridToReceive, mapGridToSend, mapInfoToReceive, mapInfoToSend, mapOptionsToReceive, mapOptionsToSend } from '../models/APIMappers';
import { useNewGame } from './GameController';

/**
 * @brief React Context for managing the global loading state of the application.
 */
const LoadingContext = createContext();

/**
 * @brief Provider component for the Loading Context.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The LoadingProvider component.
 */
export function LoadingProvider({ children }) {
    /** @brief State indicating whether initial data loading/setup is still in progress. */
    const [loading, setLoading] = useState(true);
    return (
        <LoadingContext.Provider value={{ loading, setLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

/**
 * @brief Hook to access the Loading state and setter.
 * @returns {object} The loading state and control functions.
 */
export function useLoading() {
    return useContext(LoadingContext);
}

/**
 * @brief Hook to handle debounce-based automatic saving of the game state to the server.
 * @param {boolean} loading - Current loading state (prevents saving while loading).
 * @param {object} currentState - Combined object of all current game state models (grid, info, options, history).
 */
function useAutoSave(loading, currentState) {
    /** @brief Ref to track when the first change in a batch occurred (for max wait check). */
    const firstChangeTime = useRef(null);
    /** @brief Ref for the pending debounce timeout ID. */
    const timeoutRef = useRef(null);
    
    /** @brief Ref for the latest state to be accessed by the debounced save function. */
    const latestStateRef = useRef(currentState);

    useEffect(() => {
        latestStateRef.current = currentState;
    }, [currentState]);

    useEffect(() => {
        if (loading) return;

        /**
         * @brief Performs the serialization and API call for saving the state.
         */
        const performSave = () => {
            const { gridData, gameInfo, gameOptions, history } = latestStateRef.current;
            
            console.log("Auto-saving (Background)...");
            
            const stateToSend = {
                grid: mapGridToSend(gridData),
                info: mapInfoToSend(gameInfo),
                options: mapOptionsToSend(gameOptions),
                history
            };

            sendState(stateToSend).catch(err => console.error("Auto-save failed:", err));
            
            // Reset the "batch" timer
            firstChangeTime.current = null;
        };

        // 1. Initialize start time of this "batch" of changes
        if (firstChangeTime.current === null) {
            firstChangeTime.current = Date.now();
        }

        const timeSinceFirstChange = Date.now() - firstChangeTime.current;

        // 2. Clear any pending debounce
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // 3. FAILSAFE: Max Wait Check (Save now if waiting > 10 seconds)
        if (timeSinceFirstChange > 10000) {
             performSave();
             return; 
        }

        // 4. STANDARD: Debounce (Wait for 2 seconds of silence)
        timeoutRef.current = setTimeout(() => {
            performSave();
        }, 2000);

        // Cleanup: clear the debounce timer if a new change occurs
        return () => clearTimeout(timeoutRef.current);

    }, [currentState, loading]); // Triggers on every single change to grid/info/options
}

/**
 * @brief Hook to manage the initial loading and cleanup saving processes.
 * It fetches the state upon mount or starts a new game, and ensures the state is saved upon unmount.
 * @returns {object} Object containing the current loading status.
 */
export function useSetupSudoku() {
    const { options: gridData, setOptions: setGridData } = useGrid();
    const { options: gameInfo, setOptions: setGameInfo } = useGameInfo();
    const { options: gameOptions, setOptions: setGameOptions } = useGameOptions();
    const { history, setHistoryState } = useHistory();
    const { loading, setLoading } = useLoading();
    
    /** @brief Combined state object for autosave. */
    const currentState = { gridData, gameInfo, gameOptions, history };
    const {newGame} = useNewGame();

    /** @brief Flag to ensure save only happens if data was successfully fetched/initialized. */
    const hasData = useRef(false);
    /** @brief Ref to hold the latest state accessible by the unmount cleanup function. */
    const dataRef = useRef({gridData, gameInfo, gameOptions, history})

    useEffect(() => {
        dataRef.current = {
            gridData,
            gameInfo,
            gameOptions,
            history
        };
    }, [gridData, gameInfo, gameOptions, history]);

    // Initialize and run the autosave logic
    useAutoSave(loading, currentState);

    useEffect(() => {
        let isMounted = true;
        
        /**
         * @brief Async function to fetch state from the server and initialize local models.
         */
        async function setup() {
            const response = await fetchState();
            if (!isMounted) return
            if (response.err === 0) {
                if (response.info != null) {
                    setGameInfo(mapInfoToReceive(response.info));
                    console.log("Updating info with: ", response.info)
                }
                if (response.options != null) {
                    setGameOptions(mapOptionsToReceive(response.options));
                    console.log("Updating options with: ", response.options)
                }
                if (response.history != null) {
                    console.log("Updating history with: ", response.history);
                    setHistoryState(response.history);
                }
                if (response.grid != null) {
                    console.log("Updating grid data received: ", response.grid)
                    const data = mapGridToReceive(response.grid)
                    console.log("Updating grid data with: ", data)
                    setGridData(prev => ({ ...prev, ...data }));
                } else {
                    newGame(); // Start a new game if no saved grid data is found
                }
            } else {
                console.error("Error fetching Sudoku state:", response.err);
            }
            setLoading(false);
            hasData.current = true
        }

        setup();

        // Cleanup function for unmount (Final Save)
        return () => {
            if (!hasData.current) return

            const { gridData, gameInfo, gameOptions, history } = dataRef.current;
            const stateToSend = {
                grid: mapGridToSend(gridData),
                info: mapInfoToSend(gameInfo),
                options: mapOptionsToSend(gameOptions),
                history
            };
            console.log("SENDING THIS", gridData, gameInfo, gameOptions, history)
            sendState(stateToSend).catch(err => console.error("Error sending Sudoku state:", err));
            isMounted = false;
        };
    }, []);

    return { loading };
}