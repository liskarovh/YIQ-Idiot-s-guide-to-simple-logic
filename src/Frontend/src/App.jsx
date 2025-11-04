import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import Sudoku from './sudoku/Sudoku';
import Tic_Tac_Toe from './tic_tac_toe/Tic_Tac_Toe';
import MinesweeperSettingsView from './minesweeper/MinesweeperSettingsView';
import {MinesweeperGameView} from "./minesweeper/MinesweeperGameView";
import About from './About';
import styles from './Styles';

/**
 * MAIN APP COMPONENT
 *
 * This is the root component that sets up routing for the entire application.
 *
 */

function App() {
  return (
    // BrowserRouter wraps the entire app to enable routing
    <BrowserRouter>
      <div style={styles.container}>
      {/* Content area where routed components appear */}
        {/* Routes defines which component to show based on URL */}
        <Routes>
          {/*
            Each Route has:
            - path: the URL path (e.g., "/sudoku")
            - element: the component to render
          */}
          <Route path="/" element={<Home />} />
          <Route path="/sudoku" element={<Sudoku />} />
          <Route path="/tic_tac_toe" element={<Tic_Tac_Toe />} />
            <Route path="/minesweeper">
                <Route index element={<MinesweeperSettingsView />} />
                <Route path="play/:gameId" element={<MinesweeperGameView />} />
            </Route>
          <Route path="/about" element={<About />}/>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
