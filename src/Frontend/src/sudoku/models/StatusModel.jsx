import { createContext, useContext, useState } from "react";

const StatusContext = createContext(null);

/**
 * STATUS MODEL
 * Manages "Meta" game state that needs to persist across navigation views.
 * - Global Status (Game Over, Error Modals, Hint Text)
 * - Hint Highlights (Specific visual overlays from the server)
 */
export function StatusProvider({ children }) {
  
  /**
   * Unified Status Object
   * Structure: { type: 'hint' | 'error' | 'completed', title: string, text: string, dismissText: string | null }
   */
  const [status, setStatus] = useState(null);

  const [hintHighlights, setHintHighlights] = useState(
      Array(9).fill(null).map(() => Array(9).fill(false))
  );

  // Helper to quickly clear all hint data
  const clearHints = () => {
    setStatus(null);
    setHintHighlights(Array(9).fill(null).map(() => Array(9).fill(false)));
  };

  return (
    <StatusContext.Provider value={{
      status, 
      setStatus,
      hintHighlights, 
      setHintHighlights,
      clearHints
    }}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error("useStatus must be used within a StatusProvider");
  }
  return context;
}