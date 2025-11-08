import React, { createContext, useContext, useState, useCallback } from "react";

/**
 *  Holds context for currently played game
 */
const GameInfoContext = createContext();

export const GameInfoProvider = ({ children }) => {
  const [options, setOptions] = useState({
    mode: null,
    difficulty: null,
    timer: null,
    hintsUsed: 0,
  });

  const updateOption = useCallback((key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <GameInfoContext.Provider value={{ options, setOptions, updateOption }}>
      {children}
    </GameInfoContext.Provider>
  );
};

export const useGameInfo = () => useContext(GameInfoContext);
