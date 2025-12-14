/**
 * @file Sudoku.jsx
 * @brief Main wrapper component for the Sudoku application. It establishes all necessary Context Providers (Models) and uses the Navigation and Loading Controllers to render the active view.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Game from './views/Game'
import Selection from './views/Selection'
import Strategy from './views/Strategy'
import { useSudokuNavigation, NavigationProvider } from './controllers/NavigationController';
import { GameOptionsProvider } from './models/SettingsModel';
import { GridProvider } from './models/GridModel';
import { GameInfoProvider } from './models/GameInfoModel';
import { useSetupSudoku, LoadingProvider } from './controllers/SudokuController';
import Loading from './views/Loading';
import { HistoryProvider } from './models/HistoryModel';
import { StatusProvider } from './models/StatusModel';

/**
 * @brief Component responsible for determining which view to render based on loading status and active navigation state.
 * @returns {JSX.Element} The active view component (Game, Selection, Strategy, or Loading).
 */
function SudokuContent() {
  /** @brief Hook to manage initial setup and loading status. */
  const { loading } = useSetupSudoku();

  // ============= MAIN RENDER =============
  /** @brief Hook to determine the current view from the navigation state. */
  const { activeView } = useSudokuNavigation();

  if (loading) return <Loading />;

  switch (activeView) {
    case "Game":
      return <Game/>
    case "Selection":
      return <Selection/>
    case "Strategy":
      return <Strategy/>
    default:
      return <Selection/>
  }
}


/**
 * @brief Root component for the Sudoku application, nesting all state providers.
 * @returns {JSX.Element} The Sudoku root component with all providers wrapped around the content.
 */
export default function Sudoku() {
  /** @brief Hook to get initial view from routing state. */
  const location = useLocation();
  const initialView = location.state?.view || "Game";

  return (
    <NavigationProvider initialView={initialView}>
      <GameOptionsProvider>
        <HistoryProvider>
          <StatusProvider>
            <GridProvider>
              <GameInfoProvider>
                <LoadingProvider>
                  <SudokuContent/>
                </LoadingProvider>
              </GameInfoProvider>
            </GridProvider>
          </StatusProvider>
        </HistoryProvider>
      </GameOptionsProvider>
    </NavigationProvider>
  )
};