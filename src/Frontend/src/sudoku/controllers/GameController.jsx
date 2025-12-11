import { useState, useEffect } from 'react';
import { useGrid } from '../models/GridModel';
import { useGameInfo } from '../models/GameInfoModel';
import { useGameOptions } from '../models/SettingsModel';
import { useLoading } from './SudokuController';
import { useSudokuNavigation } from './NavigationController';
import { mapGridToReceive } from '../models/APIMappers';
import { fetchNewGrid } from '../models/ServerCommunicationModel';

/**
 * SUDOKU CONTROLLER - MVC Structure
 * 
 * This hook manages the game state and logic for Sudoku
 * Uses GridContext and GameOptionsContext for state management
 */


export function useGameController() {
  // ==================== CONTEXTS ====================
  
  const { options: gridData, clearCell,
    setCellValue, getConflicts, isFilled, getNumberCounts, getNumCells } = useGrid();
  const { options: gameInfo, setOptions: setGameInfo, } = useGameInfo();
  const { options: gameOptions, updateOption: updateOption } = useGameOptions();
  
  // ==================== LOCAL STATE ====================
  
  const [isComplete, setIsComplete] = useState(false);
  const [mistakes, setMistakes] = useState(
    Array(9).fill(null).map(() => Array(9).fill(false))
  );
  const [completedNumbers, setCompletedNumbers] = useState([])
  const [highlightNumbers, setHighlightNumbers] = useState(
    Array(9).fill(null).map(() => Array(9).fill(false))
  )
  const [highlightAreas, setHighlightAreas] = useState(
    Array(9).fill(null).map(() => Array(9).fill(false))
  )

  useEffect(() => {
          if (gameInfo.timer === null || isComplete) return;
          const interval = setInterval(() => {
              setGameInfo(prev => ({
                  ...prev,
                  timer: (prev.timer ?? 0) + 1
              }));
          }, 1000);
          return () => clearInterval(interval);
      }, [gameInfo.timer, setGameInfo, isComplete]);


  useEffect(() => {
    updateAll();
  }, [gridData.values, gameOptions.highlightCompleted, gameOptions.checkMistakes]);

  useEffect(() => {
    generalUpdateNumberHighlights()
    generalUpdateAreaHighlights()
  }, [gameOptions.selectedCell, gameOptions.selectedNumber, gameOptions.selectMethod, gameOptions.highlightNumbers, gameOptions.highlightAreas]);
  
  
  // ==================== INPUT HANDLING ====================

  const NumberFirstStrategy = {
    cellClicked: (row, col) => {
      if (gameOptions.clear) {
        clearCell(row, col, gameOptions.notes);
      } else {
        setCellValue(row, col, gameOptions.selectedNumber, gameOptions.notes);
      }
    },
    numberClicked: (num) => {
      updateOption('selectedNumber', num)
    },
    eraseClicked: () => {
      updateOption('clear', !gameOptions.clear)
    },
    updateNumberHighlights: () => {
      updateNumberHighlights(gameOptions.selectedNumber)
    },
    updateAreaHighlights: () => {
      setHighlightAreas(Array(9).fill(null).map(() => Array(9).fill(false)))
    }
  }

  const CellFirstStrategy = {
    cellClicked: (row, col) => {
      updateOption('selectedCell', {row: row, col: col})
    },
    numberClicked: (num) => {
      const cell = gameOptions.selectedCell
      setCellValue(cell.row, cell.col, num, gameOptions.notes);
      
    },
    eraseClicked: () => {
      const cell = gameOptions.selectedCell
      clearCell(cell.row, cell.col, gameOptions.notes);
    },
    updateNumberHighlights: () => {
      const cell = gameOptions.selectedCell
      const val = gridData.values[cell.row][cell.col]
      if (val === null) {
        setHighlightNumbers(Array(9).fill(null).map(() => Array(9).fill(false)))
      } else {
        updateNumberHighlights(val)
      }
    },
    updateAreaHighlights: () => {
      const cell = gameOptions.selectedCell;
      updateAreaHighlights(cell.row, cell.col)
    }
  }

  

  function cellClicked(row, col) {
    if (isComplete) return;

    let strategy
    if (gameOptions.selectMethod === "Number") {
      strategy = NumberFirstStrategy
    } else {
      strategy = CellFirstStrategy
    }

    strategy.cellClicked(row,col)
  }

  function numberClicked(num) {
    if (isComplete) return;

    let strategy
    if (gameOptions.selectMethod === "Number") {
      strategy = NumberFirstStrategy
    } else {
      strategy = CellFirstStrategy
    }

    strategy.numberClicked(num)
  }

  function eraseClicked() {
    if (isComplete) return;

    let strategy
    if (gameOptions.selectMethod === "Number") {
      strategy = NumberFirstStrategy
    } else {
      strategy = CellFirstStrategy
    }

    strategy.eraseClicked()
  }

  function hintClicked() {
    // TODO
  }

  function undoClicked() {
    // TODO
  }

  function notesClicked() {
    updateOption('notes', !gameOptions.notes)
  }

  function inputClicked() {
    let newOpt
    if (gameOptions["selectMethod"] === "Number") {newOpt="Cell"} else {newOpt="Number"}
    updateOption('selectMethod', newOpt)
  }

  // ==================== UPDATE STATE ====================

  function updateAll() {
    const conflicts = getConflicts()
    updatePuzzleCompletion(conflicts)
    updateNumberCompletion(conflicts)
    updateMistakes(conflicts)
    generalUpdateNumberHighlights()
    generalUpdateAreaHighlights()
  }

  function updatePuzzleCompletion(conflicts) {
    if (isFilled() && (conflicts.length === 0)) {
      setIsComplete(true)
    }
  }

  function updateNumberCompletion(conflicts) {
    if (!gameOptions.highlightCompleted) return;

    const completed = [];
    const counts = getNumberCounts();

    console.log("Counts:", counts);

    for (let num = 1; num <= 9; num++) {
      if (counts[num - 1] === 9) {
        let hasConflict = false;

        for (const conflict of conflicts) {
          const [row, col] = conflict;
          if (gridData.values[row][col] === num) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          completed.push(num);
        }
      }
    }

    console.log("Completed:", completed);
    setCompletedNumbers(completed);
  }


  function updateMistakes(conflicts) {
    
    if (gameOptions.checkMistakes === "OFF") return;
    if (gameOptions.checkMistakes === "Conflict") {
      let mistakes = Array(9).fill(null).map(() => Array(9).fill(false))
      for (let conflict of conflicts) {
        const row = conflict[0]
        const col = conflict[1]
        if (gridData.types[row][col] === "Given") continue
        mistakes[row][col] = true
      }
      setMistakes(mistakes)
    } else {
      // TODO call REST
    }
  }

  function generalUpdateAreaHighlights() {
    if (!gameOptions.highlightAreas) {
      // Clear
      setHighlightAreas(Array(9).fill(null).map(() => Array(9).fill(false)));
      return;
    }
    if (gameOptions.selectMethod === "Number") {
      NumberFirstStrategy.updateAreaHighlights()
    } else {
      CellFirstStrategy.updateAreaHighlights()
    }
  }

  function generalUpdateNumberHighlights() {
    if (!gameOptions.highlightNumbers) return;
    if (gameOptions.selectMethod === "Number") {
      NumberFirstStrategy.updateNumberHighlights()
    } else {
      CellFirstStrategy.updateNumberHighlights()
    }
  }

  function updateNumberHighlights(num) {
    const cells = getNumCells(num)
    let highlights = Array(9).fill(null).map(() => Array(9).fill(false))
    for (let cell of cells) {
      highlights[cell[0]][cell[1]] = true
    }
    setHighlightNumbers(highlights)
  }

  function updateAreaHighlights(row, col) {
    const highlights = Array(9).fill(null).map(() => Array(9).fill(false));

      for (let i = 0; i < 9; i++) {
        highlights[row][i] = true;
        highlights[i][col] = true;
      }

      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          highlights[startRow + r][startCol + c] = true;
        }
      }

      setHighlightAreas(highlights);
  }

  
  // ==================== CONVERT GRID FOR VIEW ====================
  
  function getGridDataForView() {

    if (!gridData.types) {
      return Array(9).fill(null).map(() => 
        Array(9).fill(null).map(() => ({ value: null, type: "Value" }))
      );
    }

    const gridViewData = [];
    
    for (let row = 0; row < 9; row++) {
      const rowData = [];
      for (let col = 0; col < 9; col++) {
        const type = gridData.types[row][col];
        const value = type === "Pencil" 
          ? gridData.pencils[row][col] 
          : gridData.values[row][col];
        
        rowData.push({
          value,
          type
        });
      }
      gridViewData.push(rowData);
    }
    
    return gridViewData;
  }
  
  const selectedCell = gameOptions.selectMethod === "Cell" ?  gameOptions.selectedCell : null
  const selectedNumber = gameOptions.selectMethod === "Number" ?  gameOptions.selectedNumber : 0
  
  
  // ==================== RETURN INTERFACE ====================
  
  return {
    // State
    gridData: getGridDataForView(),
    selectedCell: selectedCell,
    selectedNumber: selectedNumber,
    eraseOn: gameOptions.clear,
    notesOn: gameOptions.notes,
    inputMethod: gameOptions.selectMethod,
    mode: gameInfo.mode,
    difficulty: gameInfo.difficulty,
    timer: gameInfo.timer,
    hintsUsed: gameInfo.hintsUsed,
    isComplete,
    mistakes: mistakes,
    completedNumbers,
    highlightNumbers,
    highlightAreas,

    
    // Actions
    cellClicked,
    numberClicked,
    hintClicked,
    undoClicked,
    eraseClicked,
    notesClicked,
    inputClicked,
  };
}

export function useNewGame() {
  const { setOptions: setGridData } = useGrid();
  const { setOptions: setGameInfo } = useGameInfo();
  const { options: gameOptions } = useGameOptions();
  const { setLoading } = useLoading();
  const { setRelativeView } = useSudokuNavigation();

  async function newGame() {
        setLoading(true);

        let difficulty;
        if (gameOptions.mode === "Prebuilt") {
            difficulty = gameOptions.prebuiltDifficulty;
        } else if (gameOptions.mode === "Learn") {
            difficulty = gameOptions.learnDifficulty;
        } else {
            difficulty = gameOptions.generatedDifficulty;
        }
        
        const info = {
            mode: gameOptions.mode,
            difficulty,
            timer: gameOptions.timer ? 0 : null,
            hintsUsed: 0
        };

        setGameInfo(info);

        const newGrid = await fetchNewGrid();

        if (newGrid.err === 0) {
            console.log("Updating grid data received: ", newGrid);
            const data = mapGridToReceive(newGrid);
            setGridData(prev => ({ ...prev, ...data }));
        } else {
            console.error("Error fetching Sudoku state:", newGrid.err);
        }
        
        setRelativeView("Game");
        setLoading(false);
    }

    return { newGame };
}