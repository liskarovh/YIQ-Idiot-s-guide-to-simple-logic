import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { fetchState, sendState } from '../models/ServerCommunicationModel';
import { useGrid } from '../models/GridModel';
import { useGameInfo } from '../models/GameInfoModel';
import { useGameOptions } from '../models/SettingsModel';
import { useHistory } from '../models/HistoryModel';
import { mapGridToReceive, mapGridToSend, mapInfoToReceive, mapInfoToSend, mapOptionsToReceive, mapOptionsToSend } from '../models/APIMappers';
import { useNewGame } from './GameController';

// Create a loading context
const LoadingContext = createContext();

export function LoadingProvider({ children }) {
    const [loading, setLoading] = useState(true);
    return (
        <LoadingContext.Provider value={{ loading, setLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    return useContext(LoadingContext);
}

function useAutoSave(loading, currentState) {
    // Track when the *first* unsaved change happened
    const firstChangeTime = useRef(null);
    const timeoutRef = useRef(null);
    
    // We need a ref for the latest data so the timeout function can access it 
    // without becoming a dependency itself
    const latestStateRef = useRef(currentState);

    useEffect(() => {
        latestStateRef.current = currentState;
    }, [currentState]);

    useEffect(() => {
        if (loading) return;

        // Helper to perform the actual save and reset timers
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
        // If this is null, it means we are starting a new batch of changes
        if (firstChangeTime.current === null) {
            firstChangeTime.current = Date.now();
        }

        const timeSinceFirstChange = Date.now() - firstChangeTime.current;

        // 2. Clear any pending debounce
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // 3. FAILSAFE: Max Wait Check
        // If we have been waiting/clicking for > 10 seconds, SAVE NOW.
        if (timeSinceFirstChange > 10000) {
             performSave();
             return; 
        }

        // 4. STANDARD: Debounce
        // Otherwise, wait for 2 seconds of silence
        timeoutRef.current = setTimeout(() => {
            performSave();
        }, 2000);

        // Cleanup
        return () => clearTimeout(timeoutRef.current);

    }, [currentState, loading]); // Triggers on every single change to grid/info/options
}

export function useSetupSudoku() {
    const { options: gridData, setOptions: setGridData } = useGrid();
    const { options: gameInfo, setOptions: setGameInfo } = useGameInfo();
    const { options: gameOptions, setOptions: setGameOptions } = useGameOptions();
    const { history, setHistoryState } = useHistory();
    const { loading, setLoading } = useLoading();
    const currentState = { gridData, gameInfo, gameOptions, history };
    const {newGame} = useNewGame();

    const hasData = useRef(false);
    const dataRef = useRef({gridData, gameInfo, gameOptions, history})

    useEffect(() => {
        dataRef.current = {
            gridData,
            gameInfo,
            gameOptions,
            history
        };
    }, [gridData, gameInfo, gameOptions, history]);

    useAutoSave(loading, currentState);

    useEffect(() => {
        let isMounted = true;
        
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
                    newGame();
                }
            } else {
                console.error("Error fetching Sudoku state:", response.err);
            }
            setLoading(false);
            hasData.current = true
        }

        setup();

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