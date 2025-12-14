/**
 * @file GameInfoModel.jsx
 * @brief Context and hook for managing meta-information about the currently active game session, such as mode, difficulty, timer, and hints used.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * @brief React Context for meta-information about the currently played game.
 */
const GameInfoContext = createContext();

/**
 * @brief Provider component for the Game Info Context.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The GameInfoProvider component.
 */
export const GameInfoProvider = ({ children }) => {
  /** @brief State holding meta-information for the current game. */
  const [options, setOptions] = useState({
    mode: null,
    difficulty: null,
    timer: null,
    hintsUsed: 0,
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
    <GameInfoContext.Provider value={{ options, setOptions, updateOption }}>
      {children}
    </GameInfoContext.Provider>
  );
};

/**
 * @brief Hook to access the Game Info context values.
 * @returns {object} The game info state and control functions.
 */
export const useGameInfo = () => useContext(GameInfoContext);