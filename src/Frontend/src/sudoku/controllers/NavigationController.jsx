import React, { createContext, useContext, useState, useRef } from "react";

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const [activeView, setActiveView] = useState("Selection");

  const viewStack = useRef(["Selection"]);

  function absoluteSetView(view) {
    viewStack.current = [view]
    setActiveView(view)
  }

  function setRelativeView(view) {
    viewStack.current.push(view)
    setActiveView(view)
  }

  function goBack() {
    if (viewStack.current.length > 1) {
      viewStack.current.pop()
      const lastView = viewStack.current[viewStack.current.length - 1];
      setActiveView(lastView);
    }
  }

  return (
    <NavigationContext.Provider value={{ activeView, absoluteSetView, setRelativeView, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useSudokuNavigation() {
  return useContext(NavigationContext);
}
