/**
 * @file HistoryModel.jsx
 * @brief Context and hook for managing the game's undo history as a stack of inverse operations.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React, { createContext, useContext, useState, useCallback } from "react";

/** @brief React Context for the history stack and control functions. */
const HistoryContext = createContext();

/**
 * @brief Provider component for the History Context.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The HistoryProvider component.
 */
export const HistoryProvider = ({ children }) => {
  /** @brief State representing the stack of inverse actions for undo functionality. */
  const [history, setHistory] = useState([]);

  /**
   * @brief Pushes an inverse operation to the history stack.
   * @param {object} inverseAction - The action required to undo the last move.
   */
  const addHistoryItem = useCallback((inverseAction) => {
    setHistory(prev => [...prev, inverseAction]);
  }, []);

  /**
   * @brief Pops the last inverse operation from the stack for execution.
   * @returns {object | null} The last inverse action or null if the stack is empty.
   */
  const popHistoryItem = useCallback(() => {
    let item = null;
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      item = newHistory.pop();
      return newHistory;
    });
    return item;
  }, []);

  /**
   * @brief Clears the entire history stack.
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  /**
   * @brief Sets the history state directly (used for loading saved state).
   * @param {Array<object>} newHistory - The new array of history items.
   */
  const setHistoryState = useCallback((newHistory) => {
    setHistory(newHistory || []);
  }, []);

  return (
    <HistoryContext.Provider value={{ history, setHistoryState, addHistoryItem, popHistoryItem, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

/**
 * @brief Hook to access the History context values.
 * @returns {object} The history state and control functions.
 */
export const useHistory = () => useContext(HistoryContext);