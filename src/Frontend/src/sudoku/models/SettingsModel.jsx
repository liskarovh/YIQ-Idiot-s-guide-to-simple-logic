/**
 * @file SettingsModel.jsx
 * @brief Context and hook for managing user-configurable game options and preferences.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * @brief React Context for user-defined game options.
 */
const GameOptionsContext = createContext();

/**
 * @brief Provider component for the Game Options Context.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The GameOptionsProvider component.
 */
export const GameOptionsProvider = ({ children }) => {
  /** @brief State holding all user-configurable options. */
  const [options, setOptions] = useState({
    mode: "Prebuilt",
    generatedDifficulty: "Medium",
    learnDifficulty: "Hidden Singles",
    prebuiltDifficulty: "Medium",
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

  /**
   * @brief Updates a single option key-value pair in the state.
   * @param {string} key - The option key to update.
   * @param {*} value - The new value for the option.
   */
  const updateOption = useCallback((key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <GameOptionsContext.Provider value={{ options, setOptions, updateOption }}>
      {children}
    </GameOptionsContext.Provider>
  );
};

/**
 * @brief Hook to access the Game Options context values.
 * @returns {object} The options state and update functions.
 */
export const useGameOptions = () => useContext(GameOptionsContext);