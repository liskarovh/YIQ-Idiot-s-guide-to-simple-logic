/**
 * @file    tic_tac_toe.jsx
 * @brief   Top-level router and context provider for the Tic-Tac-Toe feature.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import GamePage from './react/pages/GamePage.jsx';
import GameSettingsPage from './react/pages/GameSettingsPage.jsx';
import StrategyPage from './react/pages/StrategyPage.jsx';
import { GameProvider } from './react/hooks/gameContext.js';

/**
 * Tic_Tac_Toe
 * Wraps all Tic-Tac-Toe routes in a shared GameProvider context.
 */
export default function Tic_Tac_Toe() {
    return (
            <GameProvider>
                <Routes>
                    {/* Home */}
                    <Route index element={<GamePage />} />

                    {/* Settings page */}
                    <Route path="settings" element={<GameSettingsPage />} />

                    {/* Game route */}
                    <Route path="game" element={<GamePage />} />

                    {/* Strategy guide page */}
                    <Route path="strategy" element={<StrategyPage />} />

                    {/* Spectator mode (AI vs AI) */}
                    <Route path="spectate" element={<GamePage />} />

                    {/* Fallback to root */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </GameProvider>
    );
}
