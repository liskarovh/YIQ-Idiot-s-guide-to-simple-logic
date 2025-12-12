import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { fetchState, sendState } from '../models/ServerCommunicationModel';
import { useGrid } from '../models/GridModel';
import { useGameInfo } from '../models/GameInfoModel';
import { useGameOptions } from '../models/SettingsModel';
import { useHistory } from '../models/HistoryModel';
import { mapGridToReceive, mapGridToSend, mapInfoToReceive, mapInfoToSend, mapOptionsToReceive, mapOptionsToSend } from '../models/APIMappers';

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

export function useSetupSudoku() {
    const { options: gridData, setOptions: setGridData } = useGrid();
    const { options: gameInfo, setOptions: setGameInfo } = useGameInfo();
    const { options: gameOptions, setOptions: setGameOptions } = useGameOptions();
    const { history, setHistoryState } = useHistory();
    const { loading, setLoading } = useLoading();

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

    useEffect(() => {
        let isMounted = true;
        
        async function setup() {
            const response = await fetchState();
            if (!isMounted) return
            if (response.err === 0) {
                if (response.grid != null) {
                    console.log("Updating grid data received: ", response.grid)
                    const data = mapGridToReceive(response.grid)
                    console.log("Updating grid data with: ", data)
                    setGridData(prev => ({ ...prev, ...data }));
                }
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