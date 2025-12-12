import React, { createContext, useContext, useState, useCallback } from "react";

const HistoryContext = createContext();

export const HistoryProvider = ({ children }) => {
  const [history, setHistory] = useState([]);

  // Pushes an inverse operation to the stack
  const addHistoryItem = useCallback((inverseAction) => {
    setHistory(prev => [...prev, inverseAction]);
  }, []);

  // Pops the last inverse operation to be executed
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

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const setHistoryState = useCallback((newHistory) => {
    setHistory(newHistory || []);
  }, []);

  return (
    <HistoryContext.Provider value={{ history, setHistoryState, addHistoryItem, popHistoryItem, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => useContext(HistoryContext);