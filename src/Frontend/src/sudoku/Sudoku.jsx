import React, { useState, useEffect } from 'react';
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


function SudokuContent() {
  const { loading } = useSetupSudoku();

  // ============= MAIN RENDER =============
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



export default function Sudoku() {
  return (
    <NavigationProvider>
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