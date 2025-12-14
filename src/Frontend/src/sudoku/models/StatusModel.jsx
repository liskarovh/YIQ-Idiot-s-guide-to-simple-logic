/**
 * @file StatusModel.jsx
 * @brief Context and hook for managing global game status, such as game completion messages, errors, and server-provided hint highlights.
 *
 * @author David Krejčí <xkrejcd00>
 */
import { createContext, useContext, useState } from "react";

/**
 * @brief React Context for global game status and hint data.
 */
const StatusContext = createContext(null);

/**
 * @brief STATUS MODEL Provider component.
 * Manages "Meta" game state that needs to persist across navigation views.
 * Includes Global Status (Game Over, Error Modals, Hint Text) and Hint Highlights (Specific visual overlays from the server).
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The StatusProvider component.
 */
export function StatusProvider({ children }) {
  
  /**
   * @brief State for the unified status object.
   * Structure: { type: 'hint' | 'error' | 'completed', title: string, text: string, dismissText: string | null }
   */
  const [status, setStatus] = useState(null);

  /**
   * @brief State for highlighting specific cells based on server-side hints (9x9 boolean array).
   */
  const [hintHighlights, setHintHighlights] = useState(
      Array(9).fill(null).map(() => Array(9).fill(false))
  );

  /**
   * @brief Helper function to quickly clear all hint data and the current status message.
   */
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

/**
 * @brief Hook to access the Status context values.
 * @returns {object} The status state and control functions.
 * @throws {Error} If used outside of a StatusProvider.
 */
export function useStatus() {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error("useStatus must be used within a StatusProvider");
  }
  return context;
}