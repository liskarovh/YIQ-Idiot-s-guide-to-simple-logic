import React, { useState } from 'react';
import Header from "../../components/Header";
import Box from "../../components/Box";
import SudokuGrid from "../components/Grid";
import { useSudokuNavigation } from "../controllers/NavigationController";
import useMeasure from "react-use-measure";
import { ChevronRight } from "lucide-react";

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100%', // Changed from 100vw to prevent horizontal scroll
  overflow: 'hidden',
  backgroundColor: '#0f172a',
};

const scrollContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden', // Explicitly prevent horizontal scroll
  width: '100%',
};

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  // Matched padding from Game.jsx (7rem top)
  padding: '7rem 2rem 3rem 2rem', 
  maxWidth: '1200px', // Restricted max-width slightly
  margin: '0 auto',
  boxSizing: 'border-box',
  width: '100%',
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
const createEmptyGrid = () => Array(9).fill(null).map(() => Array(9).fill({ value: null, type: 'Input' }));

const fillGrid = (data) => {
    const grid = createEmptyGrid();
    data.forEach(({r, c, val, type}) => {
        if (Array.isArray(val)) {
            // Automatically handle arrays as Pencil marks
            grid[r][c] = { value: val, type: 'Pencil' };
        } else {
            // Handle single numbers as Given (default) or Input
            grid[r][c] = { value: val, type: type || 'Given' };
        }
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
                <p style={{ marginTop: 0 }}>Sudoku is played on a 9×9 grid. There is only one rule: every row, column, and 3×3 box must contain the numbers 1 to 9 exactly once.</p>
                <p><strong>How to read this tutorial:</strong></p>
                <ul style={{ paddingLeft: '1.2rem' }}>
                    <li><span style={{color: '#d8e0eb', fontWeight: 'bold'}}>Large Numbers</span> are fixed clues.</li>
                    <li><span style={{color: '#888', fontWeight: 'bold'}}>Small Numbers</span> are pencil marks (candidates).</li>
                    <li><span style={{color: '#a08cff', fontWeight: 'bold'}}>Purple Cells</span> are the clue/logic.</li>
                    <li><span style={{color: '#ff5555', fontWeight: 'bold'}}>Red Cells</span> are candidates you can remove.</li>
                </ul>
            </>
        ),
        // Simple solved grid example
        gridData: fillGrid([
          {r: 0, c: 1, val: 1}, {r: 1, c: 0, val: 5}, {r: 1, c: 1, val: 6}, {r: 1, c: 2, val: 9},
          {r: 1, c: 3, val: 1}, {r: 1, c: 4, val: 4}, {r: 1, c: 5, val: 2}, {r: 1, c: 6, val: 3}, 
          {r: 1, c: 7, val: 8}, {r: 1, c: 8, val: 7}, {r: 2, c: 1, val: 3}, {r: 3, c: 1, val: 7}, 
          {r: 4, c: 1, val: 2}, {r: 5, c: 1, val: 8}, {r: 6, c: 1, val: 4}, {r: 6, c: 6, val: 7}, 
          {r: 6, c: 7, val: 6}, {r: 6, c: 8, val: 5}, {r: 7, c: 1, val: 9}, {r: 7, c: 6, val: 8}, 
          {r: 7, c: 7, val: 3}, {r: 7, c: 8, val: 1}, {r: 8, c: 1, val: 5}, {r: 8, c: 6, val: 9}, 
          {r: 8, c: 7, val: 2}, {r: 8, c: 8, val: 4},
        ]),
        highlightedAreas: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            // Highlight a Row, Col, and Box to visualize the rules
            for(let i=0; i<9; i++) arr[1][i] = true;
            for(let i=0; i<9; i++) arr[i][1] = true;
            for(let i=6; i<9; i++) { for(let j=6; j<9; j++) arr[i][j] = true; }
            return arr;
        })()
    },
    basic: { 
        id: 'basic', 
        label: 'Basic techniques', 
        title: 'Hidden Single', 
        text: (
            <>
                <p style={{ marginTop: 0 }}>A <strong>Hidden Single</strong> occurs when a number can only fit into one specific cell within a 3×3 box (or row/column), even if that cell has other candidates.</p>
                <p>In the top-left box, look at the number <strong>5</strong>.</p>
                <p>The 5s in Row 0, Row 1, and Column 2 block all other spots. The <span style={{color: '#a08cff', fontWeight:'bold'}}>purple cell</span> is the only valid place for a 5.</p>
            </>
        ), 
        gridData: fillGrid([
            // The surrounding 5s
            {r: 0, c: 5, val: 5}, 
            {r: 1, c: 8, val: 5},
            {r: 4, c: 2, val: 5},
            
            // The Pencil marks in Box 0 showing where 5 is NOT possible
            // (We leave the invalid spots empty to make it obvious, or fill with junk)
            {r: 2, c: 1, val: [5], type: 'Pencil'}, // The answer
            
            // Filler to make it look like a game
            {r: 0, c: 0, val: 1}, {r: 1, c: 1, val: 2}, {r: 2, c: 0, val: 3},
        ]),
        // PURPLE highlight for the correct spot
        highlightedAreas: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[2][1] = true; 
            return arr;
        })(),
        hintHighlights: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[2][1] = true; 
            return arr;
        })()
    },
    intersections: { 
        id: 'intersections', 
        label: 'Intersections', 
        title: 'Pointing Pairs', 
        text: (
            <>
                <p style={{ marginTop: 0 }}>Look at the center box (Box 4). We need to place a <strong>7</strong>.</p>
                <p>Because of the 7s in Row 3 and Row 5, the 7 in the center box <strong>must</strong> be in the middle row (Row 4).</p>
                <p>Since the 7 is locked in that row inside the box (Purple), it cannot appear anywhere else in that row.</p>
                <p>Therefore, we can eliminate the 7 from the <span style={{color: '#ff5555', fontWeight:'bold'}}>red cell</span> on the right.</p>
            </>
        ), 
        gridData: fillGrid([
            // Blocking 7s
            {r: 3, c: 0, val: 7}, 
            {r: 5, c: 8, val: 7},
            
            // The Pointing Pair
            {r: 4, c: 3, val: [7, 1]}, 
            {r: 4, c: 4, val: [7, 2]}, 
            
            // The Victim (Target)
            {r: 4, c: 7, val: [7, 9]}, 
            
            // Filler
            {r: 4, c: 0, val: 1}, {r: 4, c: 1, val: 2}, 
        ]),
        // PURPLE for Pointing Pair, RED for Mistake/Target
        hintHighlights: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[4][3] = true; arr[4][4] = true;
            return arr;
        })(),
        mistakes: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[4][7] = true;
            return arr;
        })()
    },
    fishing: { 
        id: 'fishing', 
        label: 'Fishing', 
        title: 'X-Wing', 
        text: (
            <>
                <p style={{ marginTop: 0 }}>An <strong>X-Wing</strong> happens when a candidate appears in exactly the same two columns for two different rows (or vice versa).</p>
                <p>Look at the number <strong>4</strong> in Rows 1 and 6. It only appears in Column 1 and Column 8 (Purple).</p>
                <p>This forms a locked rectangle. One corner must be true, forcing the opposite corner to also be true.</p>
                <p>This means no other 4s can exist in Columns 1 and 8. We can remove the 4 from the <span style={{color: '#ff5555', fontWeight:'bold'}}>red cell</span>.</p>
            </>
        ), 
        gridData: fillGrid([
            // Row 1 Setup (only two spots for 4)
            {r: 1, c: 1, val: [4, 5]}, 
            {r: 1, c: 8, val: [4, 6]},
            {r: 1, c: 0, val: 1}, {r: 1, c: 2, val: 2}, {r: 1, c: 3, val: 3}, 
            {r: 1, c: 4, val: 8}, {r: 1, c: 5, val: 9}, {r: 1, c: 6, val: 7}, {r: 1, c: 7, val: 5},

            // Row 6 Setup (only two spots for 4, same cols)
            {r: 6, c: 1, val: [4, 9]}, 
            {r: 6, c: 8, val: [4, 8]},
            {r: 6, c: 0, val: 7}, {r: 6, c: 2, val: 1}, {r: 6, c: 3, val: 2}, 
            {r: 6, c: 4, val: 3}, {r: 6, c: 5, val: 5}, {r: 6, c: 6, val: 6}, {r: 6, c: 7, val: 9},

            // The Victim (Target to eliminate)
            {r: 5, c: 1, val: [4, 1]}, // A 4 in the same column
        ]),
        hintHighlights: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            // The X-Wing base corners
            arr[1][1] = true; arr[1][8] = true;
            arr[6][1] = true; arr[6][8] = true;
            return arr;
        })(),
        mistakes: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            // The eliminated candidate
            arr[5][1] = true; 
            return arr;
        })()
    },
    wings: { id: 'wings', label: 'Wings', title: 'XY-Wing', text: <p>Coming soon...</p>, gridData: createEmptyGrid() },
    unique: { id: 'unique', label: 'Unique rectangles', title: 'Unique Rectangles', text: <p>Coming soon...</p>, gridData: createEmptyGrid() },
    chains: { id: 'chains', label: 'Forcing chains', title: 'Forcing Chains', text: <p>Coming soon...</p>, gridData: createEmptyGrid() },
};

const STRATEGY_KEYS = Object.keys(STRATEGY_CONTENT);

function Strategy() {
  const { goBack } = useSudokuNavigation();
  const [activeTab, setActiveTab] = useState('rules');
  const [ref, bounds] = useMeasure();

  const currentContent = STRATEGY_CONTENT[activeTab];

  const handleNext = () => {
    const currentIndex = STRATEGY_KEYS.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % STRATEGY_KEYS.length;
    setActiveTab(STRATEGY_KEYS[nextIndex]);
  };

  const isMobile = bounds.width < 900;
  
  const layoutContainerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '2rem',
    alignItems: isMobile ? 'center' : 'flex-start', // Align top for better height handling
    justifyContent: 'center',
    width: '100%',
  };

  const gridWrapperStyle = {
    width: isMobile ? '80%' : '45%',
    maxWidth: '450px', // Reduced max width slightly to fit better
    aspectRatio: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0, // Prevent grid from shrinking too small
  };

  const textCardStyle = {
    flex: isMobile ? 'initial' : 1,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: '1rem',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: '1.6',
    fontSize: '1rem',
    boxSizing: 'border-box',
    width: isMobile ? '100%' : 'auto', // Auto width on desktop to fill flex space
    minWidth: 0, // Important for flex text wrapping
  };

  return (
    <div style={pageStyle} ref={ref}>
      <Header rightLinkTitle='Back' showBack={true} onNavigate={goBack} />
      
      <div style={scrollContainerStyle}>
        <div style={contentStyle}>
            
            {/* Main Title */}
            <h1 style={{ 
                color: '#fff', 
                fontSize: 'clamp(2rem, 4vw, 3rem)', 
                marginBottom: '2rem',
                textAlign: 'center',
                fontWeight: '800',
                marginTop: 0,
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

            {/* Content Layout */}
            <div style={layoutContainerStyle}>
                
                {/* Text Section */}
                <Box width={isMobile ? "100%" : "auto"} height="auto" style={textCardStyle}>
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
                <div style={gridWrapperStyle}>
                    <SudokuGrid 
                      gridData={currentContent.gridData}
                      selectedCell={currentContent.selectedCell || null}
                      onCellClick={() => {}}
                      highlightedNumbers={Array(9).fill(null).map(() => Array(9).fill(false))}
                      // Make sure these two lines are pulling from currentContent
                      hintHighlights={currentContent.hintHighlights || Array(9).fill(null).map(() => Array(9).fill(false))}
                      mistakes={currentContent.mistakes || Array(9).fill(null).map(() => Array(9).fill(false))}
                  />
                </div>
            </div>

            {/* Next Button Footer */}
            <div style={{ padding: '3rem 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
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
    </div>
  );
}

export default Strategy;