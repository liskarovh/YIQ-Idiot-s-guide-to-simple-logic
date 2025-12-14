/**
 * @file App.jsx
 * @brief Main application component that sets up routing for different game pages.
 *
 * @author Jan Kalina \<xkalinj00>, David Krejčí \<xkrejcd00>, Hana Liškařová \<xliskah00>
 */

import React from "react";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import styles from "./Styles";

// Common pages
import Home from "./Home.jsx";
import AboutPage from "./About.jsx";

// Sudoku
import Sudoku from "./sudoku/Sudoku";

// Minesweeper
import MinesweeperSettingsView from "./minesweeper/views/MinesweeperSettingsView";
import MinesweeperGameView from "./minesweeper/views/MinesweeperGameView";
import MinesweeperStrategyView from "./minesweeper/views/MinesweeperStrategyView";

// Tic-Tac-Toe
import Tic_tac_toe from "./tic_tac_toe/tic_tac_toe";

// Gradient background from Styles (without layout centering)
const appBg = {
    ...styles.container,
    display: "block",
    alignItems: "initial",
    justifyContent: "initial"
};

function App() {
    return (

            <BrowserRouter>
                <div style={appBg}>
                    <Routes>
                        {/* Common pages routing */}
                        <Route path="/"
                               element={
                                   <Home />}
                        />
                        <Route path="/about"
                               element={
                                   <AboutPage />}
                        />

                        {/* Main game pages routing */}
                        <Route path="/sudoku"
                               element={
                                   <Sudoku />}
                        />
                        <Route path="/tic-tac-toe/*"
                               element={
                                   <Tic_tac_toe />}
                        />
                        <Route path="/minesweeper/settings"
                               element={
                                   <MinesweeperSettingsView />}
                        />
                        <Route path="/minesweeper/strategy"
                               element={
                                   <MinesweeperStrategyView />}
                        />
                        <Route path="/minesweeper"
                               element={
                                   <MinesweeperGameView />}
                        />

                        <Route path="*"
                               element={
                                   <Navigate
                                           to="/"
                                           replace
                                   />}
                        />
                    </Routes>
                </div>
            </BrowserRouter>
    );
}

export default App;
