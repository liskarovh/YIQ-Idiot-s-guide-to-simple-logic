import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import Sudoku from './sudoku/Sudoku';
import Tic_Tac_Toe from './tic_tac_toe/Tic_Tac_Toe';
import Minesweeper from './minesweeper/Minesweeper';
import About from './About';

/**
 * MAIN APP COMPONENT
 * 
 * This is the root component that sets up routing for the entire application.
 * 
 * Key Concepts:
 * - BrowserRouter: Enables client-side routing (navigation without page reload)
 * - Routes: Container for all route definitions
 * - Route: Defines a path and which component to show
 * - Link: Navigation links (like <a> tags but without page reload)
 */

function App() {
  // Inline styles for the app
  const styles = {
    app: {
      minHeight: '100vh',
      backgroundColor: '#282c34',
      color: 'white'
    },
    nav: {
      backgroundColor: '#1a1d24',
      padding: '1rem',
      display: 'flex',
      gap: '1rem',
      borderBottom: '2px solid #61dafb'
    },
    navLink: {
      color: '#61dafb',
      textDecoration: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      transition: 'background-color 0.3s'
    }
  };

  return (
    // BrowserRouter wraps the entire app to enable routing
    <BrowserRouter>
      <div style={styles.app}>

        {/* Content area where routed components appear */}
        <div style={styles.content}>
          {/* Routes defines which component to show based on URL */}
          <Routes>
            {/* 
              Each Route has:
              - path: the URL path (e.g., "/sudoku")
              - element: the component to render
            */}
            <Route path="/" element={<Home />} />
            <Route path="/sudoku" element={<Sudoku />} />
            <Route path="/tic_tac_toe" element={<Tic_Tac_Toe />} />
            <Route path="/minesweeper" element={<Minesweeper />} />
            <Route path="/about" element={<About />}/>
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;