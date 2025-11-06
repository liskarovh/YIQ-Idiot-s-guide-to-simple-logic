// src/Frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import styles from './Styles';

// Z main v?tve (p?vodní stránky)
import Home from './Home.jsx';
import About from './About.jsx';
import Sudoku from './sudoku/Sudoku';
import Tic_Tac_Toe from './tic_tac_toe/Tic_Tac_Toe';
import MinesweeperSettingsView from './minesweeper/MinesweeperSettingsView';
import { MinesweeperGameView } from './minesweeper/MinesweeperGameView';

// Nové TTT stránky
import GamePage from './tic_tac_toe/react/pages/GamePage.jsx';
import GameSettingsPage from './tic_tac_toe/react/pages/GameSettingsPage.jsx';
import StrategyPage from './tic_tac_toe/react/pages/StrategyPage.jsx';

// Gradient pozadí z Styles na celou aplikaci (bez centrování layoutu)
const appBg = {
  ...styles.container,
  display: 'block',
  alignItems: 'initial',
  justifyContent: 'initial',
};

export default function App() {
  return (
    <BrowserRouter>
      <div style={appBg}>
        <Routes>
          {/* Spole?né stránky */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />

          {/* P?vodní (main) routy */}
          <Route path="/sudoku" element={<Sudoku />} />
          <Route path="/tic_tac_toe" element={<Tic_Tac_Toe />} />
          <Route path="/minesweeper">
            <Route index element={<MinesweeperSettingsView />} />
            <Route path="play/:gameId" element={<MinesweeperGameView />} />
          </Route>

          {/* Nové Tic-Tac-Toe (ponecháváme aliasy se _ i - pro kompatibilitu) */}
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
