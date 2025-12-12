import React, { createContext, useContext, useState, useCallback } from "react";

/**
 *  Holds context for currently played game's grid
 */
const GridContext = createContext();

export const GridProvider = ({ children }) => {
  const [options, setOptions] = useState({
    values: Array(9).fill(null).map(() => Array(9).fill(null)),
    pencils: Array(9).fill(null).map(() => Array(9).fill([])),
    types: Array(9).fill(null).map(() => Array(9).fill("Pencil")),
  });

  const updateOption = useCallback((key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear a cell's value or pencil marks
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

  // Set a value or pencil mark in a cell
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
  });

  const isFilled = () => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = options.values[row][col];
        if (value === null) {
          return false;
        }
      }
    }
    return true;
  };

  const getNumberCounts = () => {
    // Initialize counts array with 0 for each number 1-9
    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    // Iterate through all cells
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = options.values[row][col];
        if (value === null) continue
        // If value is between 1-9, increment its count
        if (value >= 1 && value <= 9) {
          counts[value - 1]++;
        }
      }
    }
    
    return counts;
  };

  const getNumCells = (num) => {
    const cells = [];
    
    // Iterate through all cells
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (options.values[row][col] === num) {
          cells.push([row, col]);
        }
      }
    }
    
    return cells;
  };

  return (
    <GridContext.Provider value={{ options, setOptions, updateOption, clearCell,
      setCellValue, restoreCell, getConflicts, isFilled, getNumberCounts, getNumCells }}>
      {children}
    </GridContext.Provider>
  );
};

export const useGrid = () => useContext(GridContext);