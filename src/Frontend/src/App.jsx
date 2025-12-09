import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import styles from './Styles';

// Common pages
import Home from './Home.jsx';
import About from './About.jsx';

// Sudoku
import Sudoku from './sudoku/Sudoku';

// Minesweeper
import MinesweeperSettingsView from './minesweeper/views/MinesweeperSettingsView';
import { MinesweeperGameView } from './minesweeper/views/MinesweeperGameView';

// Tic-Tac-Toe
import Tic_Tac_Toe from './tic_tac_toe/Tic_Tac_Toe';
import GamePage from './tic_tac_toe/react/pages/GamePage.jsx';
import GameSettingsPage from './tic_tac_toe/react/pages/GameSettingsPage.jsx';
import StrategyPage from './tic_tac_toe/react/pages/StrategyPage.jsx';

// Gradient background from Styles (without layout centering)
const appBg = {
    ...styles.container,
    display: 'block',
    alignItems: 'initial',
    justifyContent: 'initial',
};

function App() {
    return (

            <BrowserRouter>
                <div style={appBg}>
                    <Routes>
                        {/* Common pages routing */}
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />

                        {/* Main game pages routing */}
                        <Route path="/sudoku" element={<Sudoku />} />
                        <Route path="/tic_tac_toe" element={<Tic_Tac_Toe />} />
                        <Route path="/minesweeper">
                            <Route index element={<MinesweeperSettingsView />} />
                            <Route path="play/:gameId" element={<MinesweeperGameView />} />
                        </Route>

                        {/* TODO: Clean this generated mess, please */}
                        {/* New Tic-Tac-Toe (ponecháváme aliasy se _ i - pro kompatibilitu) */}
                        <Route path="/tic_tac_toe/settings" element={<GameSettingsPage />} />
                        <Route path="/tic-tac-toe/settings" element={<GameSettingsPage />} />

                        <Route path="/tic_tac_toe/strategy" element={<StrategyPage />} />
                        <Route path="/tic-tac-toe/strategy" element={<StrategyPage />} />

                        {/* Nová hra b?ží na poml?kové variant?, aby se nebila s p?vodní komponentou */}
                        <Route path="/tic-tac-toe" element={<GamePage />} />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </BrowserRouter>
    );
}

export default App;
