// src/Frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import styles from './Styles';

import Home from './Home.jsx';
import About from './About.jsx';
import GamePage from './tic_tac_toe/react/pages/GamePage.jsx';
import GameSettingsPage from './tic_tac_toe/react/pages/GameSettingsPage.jsx';
import StrategyPage from "./tic_tac_toe/react/pages/StrategyPage";


// Gradient pozadí z Styles na celou aplikaci (bez centrování layoutu)
const appBg = {
  ...styles.container,
  display: 'block',
  alignItems: 'initial',
  justifyContent: 'initial',
};

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div style={appBg}>
        <Routes>
          {/* existující stránky */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />

          {/* Tic-Tac-Toe – SETTINGS (otevře se z Home) */}
          <Route path="/tic-tac-toe/settings" element={<GameSettingsPage />} />
          <Route path="/tic_tac_toe/settings" element={<GameSettingsPage />} />

          {/* Tic-Tac-Toe – samotná hra (otevře se po „Play“ na settings) */}
          <Route path="/tic-tac-toe" element={<GamePage />} />
          <Route path="/tic_tac_toe" element={<GamePage />} />


            <Route path="/tic-tac-toe/strategy" element={<StrategyPage />} />
          <Route path="/tic_tac_toe/strategy" element={<StrategyPage />} />

          {/* fallback na Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
