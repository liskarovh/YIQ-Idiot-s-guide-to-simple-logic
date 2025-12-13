import { useState, useEffect, useRef } from 'react';
import { useGrid } from '../models/GridModel';
import { useGameInfo } from '../models/GameInfoModel';
import { useGameOptions } from '../models/SettingsModel';
import { useLoading } from './SudokuController';
import { useSudokuNavigation } from './NavigationController';
import { useStatus } from '../models/StatusModel'; // <--- NEW IMPORT
import { mapGridToReceive } from '../models/APIMappers';
import {
  fetchNewGrid,
  fetchHint,
  fetchReveal,
  fetchMistakes } from '../models/ServerCommunicationModel';
import { useHistory } from '../models/HistoryModel';

/**
 * SUDOKU CONTROLLER - MVC Structure
 * * This hook manages the game state and logic for Sudoku
 * Uses GridContext, GameOptionsContext, and StatusContext for state management
 */

export function useGameController() {
  // ==================== CONTEXTS ====================
  
  const { options: gridData, clearCell, restoreCell,
    setCellValue, getConflicts, isFilled, getNumberCounts, getNumCells } = useGrid();
  const { addHistoryItem, popHistoryItem } = useHistory();
  const { options: gameInfo, setOptions: setGameInfo, } = useGameInfo();
  const { options: gameOptions, updateOption: updateOption } = useGameOptions();
  const { status, setStatus, hintHighlights, setHintHighlights, clearHints } = useStatus();
  
  // ==================== LOCAL STATE ====================
  
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

  // Helper to check if game is locked
  const isLocked = status?.type === 'completed';
  const isRevealing = status?.type === 'revealWaiting';

  // Prevent fast mistake checking through server API
  const checkingMistakesRef = useRef(false);

  useEffect(() => {
          if (gameInfo.timer === null || isLocked) return;
          const interval = setInterval(() => {
              setGameInfo(prev => ({
                  ...prev,
                  timer: (prev.timer ?? 0) + 1
              }));
          }, 1000);
          return () => clearInterval(interval);
      }, [gameInfo.timer, setGameInfo, isLocked]);


  useEffect(() => {
    updateAll();
  }, [gridData.values, gameOptions.highlightCompleted, gameOptions.checkMistakes]);

  useEffect(() => {
    generalUpdateNumberHighlights()
    generalUpdateAreaHighlights()
  }, [gameOptions.selectedCell, gameOptions.selectedNumber, gameOptions.selectMethod, gameOptions.highlightNumbers, gameOptions.highlightAreas, gameOptions.explainSmartHints]);

  // ==================== HELPER: CAPTURE STATE ====================

  /**
   * Captures the current state of a specific cell and pushes it to the stack
   * effectively creating the "Inverse Operation" before we make a change.
   */
  function saveStateForUndo(row, col) {
    const currentState = {
      row: row,
      col: col,
      value: gridData.values[row][col],
      type: gridData.types[row][col],
      pencils: [...gridData.pencils[row][col]] // Clone array
    };
    addHistoryItem(currentState);
  }

  function shouldSaveState(row, col, isClearAction) {
    const type = gridData.types[row][col];
    const value = gridData.values[row][col];
    const pencils = gridData.pencils[row][col];

    // 1. Never save actions on "Given" (pre-filled) cells
    if (type === "Given") return false;

    // 2. If Clearing: Only save if there is actually something to remove
    if (isClearAction) {
        if (gameOptions.notes) return pencils && pencils.length > 0;
        return value !== null || (pencils && pencils.length > 0);
    }

    // 3. If Inputting:
    // We cannot add Notes to a cell that already has a main Value
    if (gameOptions.notes && type === "Value") return false;

    // All other inputs (Toggling numbers, adding notes to empty cells) always cause a change
    return true;
  }
  
  
  /**
   * Centralizes the logic for modifying the grid.
   * Handles checking validity, saving to undo history, and executing the move.
   */
  const executeMove = (row, col, isClear, value = null) => {
    
    if (shouldSaveState(row, col, isClear)) {
      saveStateForUndo(row, col);

      if (isClear) {
        clearCell(row, col, gameOptions.notes);
      } else {
        // Use the passed value (for Cell-First) or the globally selected number (for Number-First)
        const numToSet = value || gameOptions.selectedNumber;
        setCellValue(row, col, numToSet, gameOptions.notes);
      }
    }
  };

  const NumberFirstStrategy = {
    cellClicked: (row, col) => {
      executeMove(row, col, gameOptions.clear);
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
      const { row, col } = gameOptions.selectedCell;
      executeMove(row, col, false, num);
      
    },
    eraseClicked: () => {
      const { row, col } = gameOptions.selectedCell;
      executeMove(row, col, true);
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
    if (isLocked) return;

    if (isRevealing) {
      performReveal(row, col);
      return; 
    }

    let strategy
    if (gameOptions.selectMethod === "Number") {
      strategy = NumberFirstStrategy
    } else {
      strategy = CellFirstStrategy
    }

    strategy.cellClicked(row,col)
  }

  function numberClicked(num) {
    if (isLocked) return;

    if (isRevealing) {
        setStatus(null);
    }

    let strategy
    if (gameOptions.selectMethod === "Number") {
      strategy = NumberFirstStrategy
    } else {
      strategy = CellFirstStrategy
    }

    strategy.numberClicked(num)
  }

  function eraseClicked() {
    if (isLocked) return;

    if (isRevealing) {
        setStatus(null);
    }

    let strategy
    if (gameOptions.selectMethod === "Number") {
      strategy = NumberFirstStrategy
    } else {
      strategy = CellFirstStrategy
    }

    strategy.eraseClicked()
  }

  function undoClicked() {
    if (isLocked) return;

    if (isRevealing) {
        setStatus(null);
        return;
    }

    // 1. Pop the inverse operation
    const lastState = popHistoryItem();

    // 2. Execute restoration
    if (lastState) {
      restoreCell(lastState.row, lastState.col, lastState);
    }
  }

  function notesClicked() {
    updateOption('notes', !gameOptions.notes)

    setStatus(null);
  }

  function inputClicked() {
    let newOpt
    if (gameOptions["selectMethod"] === "Number") {newOpt="Cell"} else {newOpt="Number"}

    setStatus(null);

    updateOption('selectMethod', newOpt)
  }

  // ==================== HINT LOGIC ====================

  async function smartHintClicked() {
    if (isLocked) return;

    // 1. Fetch from Python API
    const response = await fetchHint();

    if (response.err === 0) {
        
        // 2. Always apply the Matrix (visuals)
        if (response.matrix) {
          setHintHighlights(response.matrix);
        }

        // 3. Logic for Status/Text
        // If explanations are OFF, we force status to null (clearing any old status)
        // If ON, we show the hint status
        if (!gameOptions.explainSmartHints) {
           setStatus(null);
        } else {
           setStatus({
              type: 'hint',
              title: response.title,
              text: response.explanation,
              dismissText: 'Got it'
           });
        }

    } else {
        console.error("Failed to get hint:", response.message);
        setStatus({
          type: 'error',
          title: "Error",
          text: "Could not fetch hint from server.",
          dismissText: "Close"
        });
    }
  }

  function revealHintClicked() {
    if (isLocked) return;

    // Strategy 1: Cell First
    if (gameOptions.selectMethod === "Cell") {
        performReveal(gameOptions.selectedCell.row, gameOptions.selectedCell.col);
    } 
    // Strategy 2: Number First
    else {
        // Enter "Selection Mode"
        setStatus({
            type: 'revealWaiting',
            title: "Reveal Cell",
            text: "Select any cell on the board to reveal its value.",
            dismissText: "Cancel" 
        });
    }
  }

  async function performReveal(row, col) {
    // Basic validation
    if (gridData.values[row][col] !== null) {
        setStatus({
            type: 'error',
            title: "Cannot Reveal",
            text: "This cell already has a value.",
            dismissText: "Okay"
        });
        return;
    }

    // 1. Fetch value
    const response = await fetchReveal(row, col);

    if (response.err === 0) {
        // 2. Update Grid
        saveStateForUndo(row, col);
        
        // Force set the value (disabling notes mode for this specific action)
        setCellValue(row, col, response.value, false); 
        
        // 3. Clear States
        setStatus(null);
    } else {
        setStatus({
            type: 'error',
            title: "Error",
            text: "Could not get cell value.",
            dismissText: "Close"
        });
    }
  }

  function dismissStatus() {
    if (!status) return;

    // Reaction based on Type
    switch (status.type) {
      case 'hint':
        // For hints: Clear text AND clear highlights
        clearHints(); 
        break;
      
      case 'error':
        // For errors: Just clear text
        setStatus(null);
        break;

      case 'completed':
        // TODO New game or something
        break;
        
      default:
        setStatus(null);
    }
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
      // Set the global status to Completed
      // This will set isLocked = true
      setStatus({
        type: 'completed',
        title: 'Complete!',
        text: 'Congratulations! You have successfully solved the Sudoku.',
        dismissText: null // Hides the dismiss button
      });
    }
  }

  function updateNumberCompletion(conflicts) {
    if (!gameOptions.highlightCompleted) return;

    const completed = [];
    const counts = getNumberCounts();

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
    setCompletedNumbers(completed);
  }


  async function updateMistakes(conflicts) {
    
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
      if (checkingMistakesRef.current) return; 
      checkingMistakesRef.current = true;

      const response = await fetchMistakes(gridData);
      
      if (response.err === 0 && response.mistakes) {
         setMistakes(response.mistakes);
      } else {
         console.error("Failed to check mistakes:", response.message);
      }
      
      checkingMistakesRef.current = false;
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
    mistakes: mistakes,
    completedNumbers,
    highlightNumbers,
    highlightAreas,
    hintHighlights,
    gameStatus: status,
    
    // Actions
    cellClicked,
    numberClicked,
    smartHintClicked,
    revealHintClicked,
    dismissStatus,
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
  const { clearHints } = useStatus(); // Use this to clear hints on new game

  async function newGame() {
        setLoading(true);

        // Reset hints when starting new game
        clearHints();

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