/**
 * @file GameController.jsx
 * @brief Main controller hook for the Sudoku game. It manages all game logic, user actions (input, undo, hint), state transitions (victory, errors), and coordinates updates across Grid, Info, Options, History, and Status models.
 *
 * @author David Krejčí <xkrejcd00>
 */
import { useState, useEffect, useRef } from 'react';
import { useGrid } from '../models/GridModel';
import { useGameInfo } from '../models/GameInfoModel';
import { useGameOptions } from '../models/SettingsModel';
import { useLoading } from './SudokuController';
import { useSudokuNavigation } from './NavigationController';
import { useStatus } from '../models/StatusModel'; 
import { mapGridToReceive } from '../models/APIMappers';
import {
  fetchNewGrid,
  fetchHint,
  fetchReveal,
  fetchMistakes } from '../models/ServerCommunicationModel';
import { useHistory } from '../models/HistoryModel';

/**
 * @brief Hook that manages the core game state, input handling, and logic.
 * @returns {object} The game state and action functions exposed to the Game view.
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
  
  /** @brief State for highlighting incorrect user input (based on checkMistakes setting). */
  const [mistakes, setMistakes] = useState(
    Array(9).fill(null).map(() => Array(9).fill(false))
  );
  /** @brief State for numbers (1-9) that are fully completed and correct. */
  const [completedNumbers, setCompletedNumbers] = useState([])
  /** @brief State for highlighting cells that contain the selected number. */
  const [highlightNumbers, setHighlightNumbers] = useState(
    Array(9).fill(null).map(() => Array(9).fill(false))
  )
  /** @brief State for highlighting the row, column, and box of the selected cell. */
  const [highlightAreas, setHighlightAreas] = useState(
    Array(9).fill(null).map(() => Array(9).fill(false))
  )

  // Helper to check if game is locked (e.g., victory screen is up)
  const isLocked = status?.type === 'completed';
  // Helper to check if the user is in the mode waiting to select a cell to reveal
  const isRevealing = status?.type === 'revealWaiting';

  /** @brief Ref to prevent multiple simultaneous mistake checking API calls. */
  const checkingMistakesRef = useRef(false);

  // ==================== EFFECTS (Timer) ====================
  
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

  // ==================== EFFECTS (Updates on Data Change) ====================
  
  /** @brief Master update loop triggered whenever core grid values change. */
  useEffect(() => {
    updateAll();
  }, [gridData.values,
    gameOptions.highlightCompleted,
    gameOptions.checkMistakes,
    getConflicts,
    isFilled,
    status?.type
  ]);

  /** @brief Update loop for highlights related to cell/number selection. */
  useEffect(() => {
    generalUpdateNumberHighlights()
    generalUpdateAreaHighlights()
  }, [gameOptions.selectedCell,
    gameOptions.selectedNumber,
    gameOptions.selectMethod,
    gameOptions.highlightNumbers,
    gameOptions.highlightAreas,
    gameOptions.explainSmartHints
  ]);

  // ==================== HELPER: UNDO HISTORY ====================

  /**
   * @brief Captures the current state of a specific cell and pushes it to the history stack.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
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

  /**
   * @brief Determines if the current user action on a cell is meaningful enough to save to history.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   * @param {boolean} isClearAction - True if the action is an erase/clear attempt.
   * @returns {boolean} True if the action should be saved for undo.
   */
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
   * @brief Centralizes grid modification logic: saves undo state, then executes the move.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   * @param {boolean} isClear - True if clearing the cell.
   * @param {number | null} [value=null] - The value to set (used in Cell-First strategy).
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

  // ==================== INPUT STRATEGIES ====================

  /** @brief Logic specific to the "Number First" input method. */
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

  /** @brief Logic specific to the "Cell First" input method. */
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

  // ==================== INPUT ACTIONS ====================

  /**
   * @brief Clears any active status or hint highlights.
   */
  function clearActiveHints() {
    if (status || hintHighlights) {
      setStatus(null);
      clearHints();
    }
  }

  /**
   * @brief Handles a click on a Sudoku cell.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   */
  function cellClicked(row, col) {
    if (isLocked) return;

    if (isRevealing) {
      performReveal(row, col);
      return; 
    }

    // Clean up hint highlights if user clicks the grid
    clearActiveHints();

    let strategy
    if (gameOptions.selectMethod === "Number") {
      strategy = NumberFirstStrategy
    } else {
      strategy = CellFirstStrategy
    }

    strategy.cellClicked(row,col)
  }

  /**
   * @brief Handles a click on a number in the selector bar.
   * @param {number} num - The selected number (1-9).
   */
  function numberClicked(num) {
    if (isLocked) return;

    if (isRevealing) {
        setStatus(null);
        clearHints(); 
    } else {
        // Clean up hint highlights on interaction
        clearActiveHints();
    }

    let strategy
    if (gameOptions.selectMethod === "Number") {
      strategy = NumberFirstStrategy
    } else {
      strategy = CellFirstStrategy
    }

    strategy.numberClicked(num)
  }

  /**
   * @brief Handles drag and drop input.
   * @param {number} num - The number being dragged.
   * @param {number} row - The row index of the drop target.
   * @param {number} col - The column index of the drop target.
   */
  function dragInput(num, row, col) {
    executeMove(row, col, false, num);
  }

  /**
   * @brief Toggles erase mode (Number-First) or executes erase on selected cell (Cell-First).
   */
  function eraseClicked() {
    if (isLocked) return;

    if (isRevealing) {
        setStatus(null);
        clearHints();
    } else {
        // Clean up hint highlights on interaction
        clearActiveHints();
    }

    let strategy
    if (gameOptions.selectMethod === "Number") {
      strategy = NumberFirstStrategy
    } else {
      strategy = CellFirstStrategy
    }

    strategy.eraseClicked()
  }

  /**
   * @brief Reverts the last action by popping and executing the inverse operation from history.
   */
  function undoClicked() {
    if (isLocked) return;

    if (isRevealing) {
        setStatus(null);
        clearHints();
        return;
    }
    
    // Undo invalidates the current hint context
    clearActiveHints();

    // 1. Pop the inverse operation
    const lastState = popHistoryItem();

    // 2. Execute restoration
    if (lastState) {
      restoreCell(lastState.row, lastState.col, lastState);
    }
  }

  /**
   * @brief Toggles the notes/pencil mark input mode.
   */
  function notesClicked() {
    updateOption('notes', !gameOptions.notes)

    // Clear UI overlays
    setStatus(null);
    clearHints();
  }

  /**
   * @brief Toggles the input method between "Number First" and "Cell First".
   */
  function inputClicked() {
    let newOpt
    if (gameOptions["selectMethod"] === "Number") {newOpt="Cell"} else {newOpt="Number"}

    // Clear UI overlays
    setStatus(null);
    clearHints();

    updateOption('selectMethod', newOpt)
  }

  // ==================== HINT & REVEAL LOGIC ====================

  /**
   * @brief Requests a Smart Hint from the backend API.
   */
  async function smartHintClicked() {
    if (isLocked) return;
    
    // Clear previous hints before fetching new one to avoid visual glitches
    clearHints();

    // 1. Fetch from Python API
    const response = await fetchHint(gridData);

    if (response.err === 0) {
        
        // 2. Always apply the Matrix (visuals)
        if (response.matrix) {
          setHintHighlights(response.matrix);
        }

        // 3. Logic for Status/Text
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

  /**
   * @brief Initiates the reveal process, either directly or by entering selection mode.
   */
  function revealHintClicked() {
    if (isLocked) return;

    // Clear any existing smart hints
    clearHints();

    // Strategy 1: Cell First (reveal the selected cell immediately)
    if (gameOptions.selectMethod === "Cell") {
        performReveal(gameOptions.selectedCell.row, gameOptions.selectedCell.col);
    } 
    // Strategy 2: Number First (enter selection mode)
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

  /**
   * @brief Fetches the solved value for a cell and inserts it into the grid.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   */
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

    if (response.err === 0 && response.value !== 0) {
        // 2. Update Grid
        saveStateForUndo(row, col);
        
        // Force set the value (disabling notes mode for this specific action)
        setCellValue(row, col, response.value, false); 
        
        // 3. Clear States
        setStatus(null);
        clearHints(); // Ensure no leftover highlights
        // Increment hints used count
        setGameInfo(prev => ({...prev, hintsUsed: prev.hintsUsed + 1}));
    } else {
        setStatus({
            type: 'error',
            title: "Error",
            text: "Could not get cell value.",
            dismissText: "Close"
        });
    }
  }

  /**
   * @brief Handles dismissing the current status message (hint, error, etc.).
   */
  function dismissStatus() {
    if (!status) return;

    // Reaction based on Type
    switch (status.type) {
      case 'hint':
        // For hints: Clear text AND clear highlights
        clearHints(); 
        break;
      
      case 'error':
      case 'revealWaiting':
        // For errors/waiting: Just clear text
        setStatus(null);
        break;

      case 'completed':
        // Victory status is permanent until a new game starts
        break;
        
      default:
        setStatus(null);
    }
  }

  // ==================== UPDATE STATE HELPERS ====================

  /**
   * @brief Executes all necessary update logic (completion, conflicts, highlights) after a user action.
   */
  function updateAll() {
    const conflicts = getConflicts()
    updatePuzzleCompletion(conflicts)
    updateNumberCompletion(conflicts)
    updateMistakes(conflicts)
    generalUpdateNumberHighlights()
    generalUpdateAreaHighlights()
  }

  /**
   * @brief Checks if the puzzle is complete and conflict-free, setting the 'completed' status if true.
   * @param {Array<Array<number>>} conflicts - Current list of conflicting cell coordinates.
   */
  function updatePuzzleCompletion(conflicts) {
    if (status?.type === 'completed') return;

    if (isFilled() && (conflicts.length === 0)) {
      // Set the global status to Completed
      // This will set isLocked = true
      setStatus({
        type: 'completed',
        title: 'Complete!',
        text: 'Congratulations! You have successfully solved the Sudoku.',
        dismissText: null // Hides the dismiss button
      });
      setHintHighlights(Array(9).fill(null).map(() => Array(9).fill(false)));
    }
  }

  /**
   * @brief Updates the list of numbers (1-9) that have been correctly completed (9 instances with no conflict).
   * @param {Array<Array<number>>} conflicts - Current list of conflicting cell coordinates.
   */
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

  /**
   * @brief Updates the list of incorrect cells based on the configured mistake checking mode.
   * @param {Array<Array<number>>} conflicts - Current list of local conflicting cell coordinates.
   */
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
      // Check Mistakes: Immediate/Solution
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

  /**
   * @brief Calls the appropriate strategy method to update area highlights based on input mode.
   */
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

  /**
   * @brief Calls the appropriate strategy method to update number highlights based on input mode.
   */
  function generalUpdateNumberHighlights() {
    if (!gameOptions.highlightNumbers) return;
    if (gameOptions.selectMethod === "Number") {
      NumberFirstStrategy.updateNumberHighlights()
    } else {
      CellFirstStrategy.updateNumberHighlights()
    }
  }

  /**
   * @brief Sets highlight state for all cells containing a specific number.
   * @param {number} num - The number to highlight.
   */
  function updateNumberHighlights(num) {
    const cells = getNumCells(num)
    let highlights = Array(9).fill(null).map(() => Array(9).fill(false))
    for (let cell of cells) {
      highlights[cell[0]][cell[1]] = true
    }
    setHighlightNumbers(highlights)
  }

  /**
   * @brief Sets highlight state for the row, column, and 3x3 box of a given cell.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   */
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
  
  /**
   * @brief Formats the internal grid data (values, pencils, types) into the unified structure expected by the SudokuGrid component.
   * @returns {Array<Array<object>>} The 9x9 grid array suitable for the view component.
   */
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
        // If cell type is Pencil, the value property should hold the pencil mark array.
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
    dragInput,
  };
}

/**
 * @brief Hook specifically for initiating a new game session.
 * @returns {object} Object containing the `newGame` function.
 */
export function useNewGame() {
  const { setOptions: setGridData } = useGrid();
  const { setOptions: setGameInfo, options: gameInfo } = useGameInfo();
  const { options: gameOptions } = useGameOptions();
  const { setLoading } = useLoading();
  const { setRelativeView } = useSudokuNavigation();
  const { clearHints } = useStatus();
  const { clearHistory } = useHistory();

  /**
   * @brief Initializes and fetches a new Sudoku game based on current user options.
   */
  async function newGame() {
        setLoading(true);

        clearHints();
        clearHistory();

        // 1. Determine the correct difficulty based on the current Mode
        let difficulty;
        if (gameOptions.mode === "Prebuilt") {
            difficulty = gameOptions.prebuiltDifficulty;
        } else if (gameOptions.mode === "Learn") {
            difficulty = gameOptions.learnDifficulty;
        } else {
            // Default to Generated
            difficulty = gameOptions.generatedDifficulty;
        }
        
        const info = {
            mode: gameOptions.mode,
            difficulty,
            timer: gameOptions.timer ? 0 : null,
            hintsUsed: 0
        };

        setGameInfo(info);

        // 2. Pass mode and difficulty to the API call
        const newGrid = await fetchNewGrid(gameOptions.mode, difficulty);

        if (newGrid.err === 0) {
            console.log("Updating grid data received: ", newGrid);
            const data = mapGridToReceive(newGrid);
            setGridData(prev => ({ ...prev, ...data }));
        } else {
            console.error("Error fetching Sudoku state:", newGrid.err);
            // Optionally set error status if fetching fails
        }
        
        setRelativeView("Game");
        setLoading(false);
    }

    return { newGame };
}