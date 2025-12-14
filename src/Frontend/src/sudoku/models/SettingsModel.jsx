import React, { createContext, useContext, useState, useCallback } from "react";

/**
 *  Holds context for options set
 */
const GameOptionsContext = createContext();

export const GameOptionsProvider = ({ children }) => {
  const [options, setOptions] = useState({
    mode: "Generated",
    generatedDifficulty: "Medium",
    learnDifficulty: "Hidden Singles",
    prebuiltDifficulty: "Easy",
    highlightNumbers: true,
    highlightAreas: true,
    highlightCompleted: true,
    checkMistakes: "Conflict",
    explainSmartHints: true,
    timer: true,
    autofillHints: false,
    selectMethod: "Number",
    selectedNumber: 1,
    selectedCell: {row: 0, col: 0},
    clear: false,
    notes: false,
  });

  const updateOption = useCallback((key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <GameOptionsContext.Provider value={{ options, setOptions, updateOption }}>
      {children}
    </GameOptionsContext.Provider>
  );
};

export const useGameOptions = () => useContext(GameOptionsContext);
