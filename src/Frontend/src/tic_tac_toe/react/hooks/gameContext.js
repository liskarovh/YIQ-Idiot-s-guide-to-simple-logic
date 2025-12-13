/**
 * @file    gameContext.js
 * @brief   React context wrapper for the shared Tic-Tac-Toe game state.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { createContext, useContext } from 'react';
import { useGame as useGameHook } from './useGame.js';

const GameContext = createContext(null);

/**
 * Provider component that owns a single useGame() instance.
 */
export function GameProvider({ children }) {
    const gameApi = useGameHook();
    return (
        <GameContext.Provider value={gameApi}>
            {children}
        </GameContext.Provider>
    );
}

/**
 * Hook used by child components to access the shared game.
 */
export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) {
        throw new Error('useGame must be used inside <GameProvider>');
    }
    return ctx;
}
