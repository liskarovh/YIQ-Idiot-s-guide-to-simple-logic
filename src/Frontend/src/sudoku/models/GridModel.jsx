/**
 * @file GridModel.jsx
 * @brief Context and hook for managing the core Sudoku grid data, including cell values, pencil marks, cell types (Given, Value, Pencil), and grid validation logic.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * @brief React Context for the active Sudoku grid state.
 */
const GridContext = createContext();

/**
 * @brief Provider component for the Grid Context.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The GridProvider component.
 */
export const GridProvider = ({ children }) => {
  /**
   * @brief State holding the grid data: values (1-9 or null), pencils (array of numbers or null), and types ("Given", "Value", "Pencil").
   */
  const [options, setOptions] = useState({
    values: Array(9).fill(null).map(() => Array(9).fill(null)),
    pencils: Array(9).fill(null).map(() => Array(9).fill([])),
    types: Array(9).fill(null).map(() => Array(9).fill("Pencil")),
  });

  /**
   * @brief Updates a single option key-value pair in the state.
   * @param {string} key - The option key to update.
   * @param {*} value - The new value for the option.
   */
  const updateOption = useCallback((key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * @brief Clears a cell's value or pencil marks based on the current mode.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   * @param {boolean} notesMode - True if currently in notes (pencil mark) mode.
   */
  const clearCell = useCallback((row, col, notesMode) => {
    setOptions(prev => {
      const type = prev.types[row][col];
      if (type === "Given") return prev;

      const newGridData = {
        ...prev,
        values: prev.values.map(r => [...r]),
        pencils: prev.pencils.map(r => r.map(cell => cell ? [...cell] : null)),
        types: prev.types.map(r => [...r])
      };

      if (notesMode) {
        newGridData.pencils[row][col] = [];
      } else if (prev.values[row][col] === null) {
        newGridData.pencils[row][col] = [];
      } else {
        newGridData.values[row][col] = null;
        newGridData.types[row][col] = "Pencil";
      }

      return newGridData;
    });
  }, []);

  /**
   * @brief Sets a value or toggles a pencil mark in a cell based on the current mode.
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   * @param {number} val - The number (1-9) to set or toggle.
   * @param {boolean} notesMode - True if currently in notes (pencil mark) mode.
   */
  const setCellValue = useCallback((row, col, val, notesMode) => {
    setOptions(prev => {
      const type = prev.types[row][col];
      if (type === "Given") return prev;

      const newGridData = {
        ...prev,
        values: prev.values.map(r => [...r]),
        pencils: prev.pencils.map(r => r.map(cell => cell ? [...cell] : null)),
        types: prev.types.map(r => [...r])
      };

      if (type === "Value" && notesMode) {
        return prev; // Don't allow pencil marks on cells with values in notes mode
      } else if (type === "Value" && !notesMode) {
        // Toggle or change the value
        if (newGridData.values[row][col] === val) {
          newGridData.values[row][col] = null;
          newGridData.types[row][col] = "Pencil";
        } else {
          newGridData.values[row][col] = val;
        }
      } else if (type === "Pencil" && notesMode) {
        // Toggle pencil mark
        if (newGridData.pencils[row][col].includes(val)) {
          newGridData.pencils[row][col] = newGridData.pencils[row][col].filter(n => n !== val);
        } else {
          newGridData.pencils[row][col].push(val);
        }
      } else {
        // Set value on empty pencil cell
        newGridData.values[row][col] = val;
        newGridData.types[row][col] = "Value";
      }

      return newGridData;
    });
  }, []);

  /**
   * @brief Restores a cell to a previous state (used for Undo).
   * @param {number} row - The row index.
   * @param {number} col - The column index.
   * @param {object} previousState - Object containing {value, type, pencils} to restore.
   */
  const restoreCell = useCallback((row, col, previousState) => {
    setOptions(prev => {
      const newGridData = {
        ...prev,
        values: prev.values.map(r => [...r]),
        pencils: prev.pencils.map(r => r.map(cell => cell ? [...cell] : [])),
        types: prev.types.map(r => [...r])
      };

      newGridData.values[row][col] = previousState.value;
      newGridData.types[row][col] = previousState.type;
      newGridData.pencils[row][col] = previousState.pencils ? [...previousState.pencils] : [];

      return newGridData;
    });
  }, []);

  /**
   * @brief Calculates and returns the list of cells involved in Sudoku rule conflicts (row, column, or 3x3 box conflicts).
   * @returns {Array<Array<number>>} An array of [row, col] pairs representing conflicting cells.
   */
  const getConflicts = useCallback(() => {
    const conflictCells = new Set();
    
    // Helper to add conflicts for a group of cells
    const checkGroup = (cells) => {
      const seen = {};
      cells.forEach(([row, col]) => {
        const value = options.values[row][col];
        if (value !== 0 && value !== null && value !== '') {
          if (seen[value]) {
            // Mark both the original and duplicate as conflicts
            seen[value].forEach(([r, c]) => conflictCells.add(`${r},${c}`));
            conflictCells.add(`${row},${col}`);
          } else {
            seen[value] = [[row, col]];
          }
        }
      });
    };
    
    // Check all rows
    for (let row = 0; row < 9; row++) {
      const cells = [];
      for (let col = 0; col < 9; col++) {
        cells.push([row, col]);
      }
      checkGroup(cells);
    }
    
    // Check all columns
    for (let col = 0; col < 9; col++) {
      const cells = [];
      for (let row = 0; row < 9; row++) {
        cells.push([row, col]);
      }
      checkGroup(cells);
    }
    
    // Check all 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const cells = [];
        for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
          for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
            cells.push([row, col]);
          }
        }
        checkGroup(cells);
      }
    }
    
    // Convert set to array of [row, col] coordinates
    return Array.from(conflictCells).map(key => {
      const [row, col] = key.split(',').map(Number);
      return [row, col];
    });
  }, [options]);

  /**
   * @brief Checks if every cell in the grid has a value (is not null).
   * @returns {boolean} True if the grid is fully filled, false otherwise.
   */
  const isFilled = useCallback(() => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = options.values[row][col];
        if (value === null) {
          return false;
        }
      }
    }
    return true;
  }, [options]);

  /**
   * @brief Calculates the count of each number (1-9) currently placed in the grid.
   * @returns {Array<number>} An array of length 9, where index 0 is the count of '1's, index 1 is the count of '2's, etc.
   */
  const getNumberCounts = useCallback(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = options.values[row][col];
        if (value === null) continue
        if (value >= 1 && value <= 9) {
          counts[value - 1]++;
        }
      }
    }
    
    return counts;
  }, [options]);

  /**
   * @brief Gets the coordinates of all cells containing a specific number.
   * @param {number} num - The number (1-9) to search for.
   * @returns {Array<Array<number>>} An array of [row, col] pairs.
   */
  const getNumCells = useCallback((num) => {
    const cells = [];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (options.values[row][col] === num) {
          cells.push([row, col]);
        }
      }
    }
    
    return cells;
  }, [options]);

  return (
    <GridContext.Provider value={{ options, setOptions, updateOption, clearCell,
      setCellValue, restoreCell, getConflicts, isFilled, getNumberCounts, getNumCells }}>
      {children}
    </GridContext.Provider>
  );
};

/**
 * @brief Hook to access the Grid context values.
 * @returns {object} The grid state and control functions.
 */
export const useGrid = () => useContext(GridContext);