import React, { useState, useMemo } from 'react';
import Header from "../../components/Header";
import Box from "../../components/Box";
import SudokuGrid from "../components/Grid";
import { useSudokuNavigation } from "../controllers/NavigationController";
import useMeasure from "react-use-measure";
import colors from "../../Colors"; // Assuming this exists based on other files
import { ChevronRight } from "lucide-react";

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  backgroundColor: '#0f172a', // Deep blue/black background
};

const contentContainerStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '1rem',
  overflowY: 'auto',
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
};

// -- STYLES FOR PILL NAVIGATION --
const navContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '0.5rem',
  marginBottom: '2rem',
  width: '100%',
};

const pillStyle = (isActive) => ({
  padding: '0.5rem 1.2rem',
  borderRadius: '999px',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: isActive ? '#d8e0eb' : 'rgba(255, 255, 255, 0.05)',
  color: isActive ? '#0f172a' : '#d8e0eb',
  border: 'none',
});

// -- CONTENT DATA --
// Helper to generate empty 9x9 grid
const createEmptyGrid = () => Array(9).fill(null).map(() => Array(9).fill({ value: null, type: 'Input' }));

// Helper to fill specific cells for demo
const fillGrid = (data) => {
    const grid = createEmptyGrid();
    data.forEach(({r, c, val, type}) => {
        grid[r][c] = { value: val, type: type || 'Given' };
    });
    return grid;
};

const STRATEGY_CONTENT = {
    rules: {
        id: 'rules',
        label: 'Rules',
        title: 'What is Sudoku?',
        text: (
            <>
                <p>Sudoku is a logic game that is played in a 9×9 grid. There is only one rule in Sudoku: every column, row and 3×3 subgrid in the Sudoku grid must have all the numbers from 1 to 9 exactly once, without repeating.</p>
                <p>Every well constructed Sudoku, like the ones in the <i>Learn</i> and <i>Prebuilt</i> game modes, has to have exactly one solution. This means that every puzzle can be solved just by using logic rules, without any guessing.</p>
                <p>If you need more information, please visit <a href="https://www.sudopedia.org" target="_blank" style={{color: '#4f94ef'}}>www.sudopedia.org</a>, an independent website dedicated to showing the logic behind this popular game.</p>
            </>
        ),
        // Reproducing the grid from the screenshot
        gridData: fillGrid([
            {r: 0, c: 0, val: 1, type: 'Given'},
            // Row 2 filled completely
            {r: 1, c: 0, val: 5, type: 'Given'}, {r: 1, c: 1, val: 6, type: 'Given'}, {r: 1, c: 2, val: 9, type: 'Given'},
            {r: 1, c: 3, val: 1, type: 'Given'}, {r: 1, c: 4, val: 4, type: 'Given'}, {r: 1, c: 5, val: 2, type: 'Given'},
            {r: 1, c: 6, val: 3, type: 'Given'}, {r: 1, c: 7, val: 8, type: 'Given'}, {r: 1, c: 8, val: 7, type: 'Given'},

        ]),
        // Highlight logic (Row 1 highlight area, specific numbers highlight)
        highlightedAreas: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            // Highlight the filled row (Row index 1)
            for(let i=0; i<9; i++) arr[1][i] = true;
            return arr;
        })(),
    },
    basic: { id: 'basic', label: 'Basic techniques', title: 'Basic Techniques', text: <p>Content for basic techniques...</p>, gridData: createEmptyGrid() },
    intersections: { id: 'intersections', label: 'Intersections', title: 'Intersections', text: <p>Content for intersections...</p>, gridData: createEmptyGrid() },
    fishing: { id: 'fishing', label: 'Fishing', title: 'Fishing', text: <p>Content for fishing...</p>, gridData: createEmptyGrid() },
    wings: { id: 'wings', label: 'Wings', title: 'Wings', text: <p>Content for wings...</p>, gridData: createEmptyGrid() },
    unique: { id: 'unique', label: 'Unique rectangles', title: 'Unique Rectangles', text: <p>Content for unique rectangles...</p>, gridData: createEmptyGrid() },
    chains: { id: 'chains', label: 'Forcing chains', title: 'Forcing Chains', text: <p>Content for forcing chains...</p>, gridData: createEmptyGrid() },
};

const STRATEGY_KEYS = Object.keys(STRATEGY_CONTENT);

function Strategy() {
  const { goBack } = useSudokuNavigation();
  const [activeTab, setActiveTab] = useState('rules');
  const [ref, bounds] = useMeasure();

  const currentContent = STRATEGY_CONTENT[activeTab];

  // Helper to go next
  const handleNext = () => {
    const currentIndex = STRATEGY_KEYS.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % STRATEGY_KEYS.length;
    setActiveTab(STRATEGY_KEYS[nextIndex]);
  };

  // Determine layout based on width (responsive)
  const isMobile = bounds.width < 900;
  
  const layoutContainerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '2rem',
    alignItems: isMobile ? 'center' : 'stretch', 
    justifyContent: 'center',
    width: '100%',
    height: '100%', 
  };

  // Grid Sizing logic
  const gridContainerStyle = {
    width: isMobile ? '80%' : '45%',
    maxWidth: '500px',
    aspectRatio: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const textCardStyle = {
    flex: 1,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: '1rem',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: '1.6',
    fontSize: '1rem',
    boxSizing: 'border-box',
    width: isMobile ? '100%' : '45%',
  };

  return (
    <div style={pageStyle} ref={ref}>
      <Header rightLinkTitle='Home' showBack={true} onNavigate={goBack} />
      
      <div style={contentContainerStyle}>
        
        {/* Main Title */}
        <h1 style={{ 
            color: '#fff', 
            fontSize: 'clamp(2rem, 4vw, 3rem)', 
            marginBottom: '2rem',
            textAlign: 'center',
            fontWeight: '800'
        }}>
            Sudoku game strategy
        </h1>

        {/* Navigation Pills */}
        <div style={navContainerStyle}>
            {STRATEGY_KEYS.map((key) => (
                <button
                    key={key}
                    style={pillStyle(activeTab === key)}
                    onClick={() => setActiveTab(key)}
                >
                    {STRATEGY_CONTENT[key].label}
                </button>
            ))}
        </div>

        {/* Split Content View */}
        <div style={layoutContainerStyle}>
            
            {/* Text Section */}
            <Box width="100%" height="auto" style={textCardStyle}>
                <h2 style={{ 
                    margin: 0, 
                    fontSize: '1.5rem', 
                    color: '#fff',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)' 
                }}>
                    {currentContent.title}
                </h2>
                <div style={{ fontSize: '1.05rem' }}>
                    {currentContent.text}
                </div>
            </Box>

            {/* Grid Visualization */}
            <div style={gridContainerStyle}>
                <SudokuGrid 
                    gridData={currentContent.gridData}
                    selectedCell={currentContent.selectedCell || null}
                    onCellClick={() => {}} // No interaction
                    highlightedNumbers={Array(9).fill(null).map(() => Array(9).fill(false))}
                    hintHighlights={currentContent.highlightedAreas || Array(9).fill(null).map(() => Array(9).fill(false))}
                    mistakes={Array(9).fill(null).map(() => Array(9).fill(false))}
                />
            </div>
        </div>

        {/* Next Button Footer */}
        <div style={{ padding: '2rem 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <button 
                onClick={handleNext}
                style={{
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '0.8rem 2.5rem',
                    borderRadius: '12px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    transition: 'transform 0.1s',
                }}
            >
                Next
                <ChevronRight size={20} />
            </button>
        </div>
      </div>
    </div>
  );
}

export default Strategy;