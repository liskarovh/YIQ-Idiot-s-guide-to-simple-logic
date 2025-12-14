/**
 * @file NavigationController.jsx
 * @brief Context and hook for managing navigation between different views (screens) within the Sudoku application using a simple view stack model.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React, { createContext, useContext, useState, useRef } from "react";
import {useNavigate} from "react-router-dom";

/** @brief React Context for application navigation. */
const NavigationContext = createContext();

/**
 * @brief Provider component for the Navigation Context.
 * Manages the active view state and a history stack for relative navigation.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components.
 * @param {string} [props.initialView="Game"] - The starting view name.
 * @returns {JSX.Element} The NavigationProvider component.
 */
export function NavigationProvider({ children, initialView = "Game" }) {
  /** @brief State representing the currently visible screen/view. */
  const [activeView, setActiveView] = useState(initialView);
  const navigate = useNavigate();

  /** @brief Ref holding the history stack of views (e.g., ["Game", "Settings", "Strategy"]). */
  const viewStack = useRef([initialView]);

  /**
   * @brief Sets a new view, clearing the entire view stack history.
   * @param {string} view - The name of the view to set.
   */
  function absoluteSetView(view) {
    viewStack.current = [view]
    setActiveView(view)
  }

  /**
   * @brief Pushes a new view onto the stack for relative navigation.
   * @param {string} view - The name of the view to push.
   */
  function setRelativeView(view) {
    viewStack.current.push(view)
    setActiveView(view)
  }

  /**
   * @brief Navigates back one step in the view stack, or navigates to the app root if the stack is empty.
   */
  function goBack() {
    if (viewStack.current.length > 1) {
      viewStack.current.pop()
      const lastView = viewStack.current[viewStack.current.length - 1];
      setActiveView(lastView);
    } else {
      navigate('/');
    }
  }

  return (
    <NavigationContext.Provider value={{ activeView, absoluteSetView, setRelativeView, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * @brief Hook to access the Sudoku navigation context values.
 * @returns {object} The navigation state and control functions.
 */
export function useSudokuNavigation() {
  return useContext(NavigationContext);
}