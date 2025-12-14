import React, { createContext, useContext, useState, useRef } from "react";
import {useNavigate} from "react-router-dom";

const NavigationContext = createContext();

export function NavigationProvider({ children, initialView = "Game" }) {
  const [activeView, setActiveView] = useState(initialView);
  const navigate = useNavigate();

  const viewStack = useRef([initialView]);

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

export function useSudokuNavigation() {
  return useContext(NavigationContext);
}
