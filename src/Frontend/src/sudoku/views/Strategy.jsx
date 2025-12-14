/**
 * @file Strategy.jsx
 * @brief Component for displaying Sudoku strategy guides with interactive grid visualizations.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React, { useState } from 'react';
import Header from "../../components/Header";
import Box from "../../components/Box";
import SudokuGrid from "../components/Grid";
import { useSudokuNavigation } from "../controllers/NavigationController";
import useMeasure from "react-use-measure";
import { ChevronRight } from "lucide-react";

/**
 * @brief Styles for the main page container.
 */
const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100%', 
  overflow: 'hidden',
};

/**
 * @brief Styles for the scrollable content area.
 */
const scrollContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden', 
  width: '100%',
};

/**
 * @brief Styles for the main content block, centered with max width.
 */
const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '7rem 2rem 3rem 2rem', 
  maxWidth: '1200px', 
  margin: '0 auto',
  boxSizing: 'border-box',
  width: '100%',
};

// -- STYLES FOR PILL NAVIGATION --
/**
 * @brief Styles for the navigation pill container.
 */
const navContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '0.5rem',
  marginBottom: '2rem',
  width: '100%',
};

/**
 * @brief Styles for an individual navigation pill button.
 * @param {boolean} isActive - Whether the pill is currently active.
 * @returns {object} The style object.
 */
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

// -- CONTENT DATA UTILITIES --
/**
 * @brief Creates an empty 9x9 Sudoku grid structure.
 * @returns {Array<Array<object>>} The empty grid.
 */
const createEmptyGrid = () => Array(9).fill(null).map(() => Array(9).fill({ value: null, type: 'Input' }));

/**
 * @brief Fills a Sudoku grid with initial data and candidates.
 * @param {Array<object>} data - Array of cell data {r, c, val, type}.
 * @returns {Array<Array<object>>} The populated grid.
 */
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

/**
 * @brief Dictionary containing all Sudoku strategy guide content.
 */
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
            {r: 0, c: 5, val: 5}, 
            {r: 1, c: 8, val: 5},
            {r: 4, c: 2, val: 5},
            {r: 2, c: 1, val: [5], type: 'Pencil'},
            {r: 0, c: 0, val: 1}, {r: 1, c: 1, val: 2}, {r: 2, c: 0, val: 3},
        ]),
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
            {r: 3, c: 0, val: 7}, 
            {r: 5, c: 8, val: 7},
            {r: 4, c: 3, val: [7, 1]}, 
            {r: 4, c: 4, val: [7, 2]}, 
            {r: 4, c: 7, val: [7, 9]}, 
            {r: 4, c: 0, val: 1}, {r: 4, c: 1, val: 2}, 
        ]),
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
                <p style={{ marginTop: 0 }}>An <strong>X-Wing</strong> happens when a candidate appears in exactly the same two columns for two different rows.</p>
                <p>Look at the number <strong>4</strong> in Rows 1 and 6. It only appears in Column 1 and Column 8 (Purple).</p>
                <p>This forms a locked rectangle. One corner must be true, forcing the opposite corner to also be true.</p>
                <p>This means no other 4s can exist in Columns 1 and 8. We can remove the 4 from the <span style={{color: '#ff5555', fontWeight:'bold'}}>red cell</span>.</p>
            </>
        ), 
        gridData: fillGrid([
            {r: 1, c: 1, val: [4, 5]}, {r: 1, c: 8, val: [4, 6]},
            {r: 1, c: 0, val: 1}, {r: 1, c: 2, val: 2}, {r: 1, c: 3, val: 3}, 
            {r: 1, c: 4, val: 8}, {r: 1, c: 5, val: 9}, {r: 1, c: 6, val: 7}, {r: 1, c: 7, val: 5},
            {r: 6, c: 1, val: [4, 9]}, {r: 6, c: 8, val: [4, 8]},
            {r: 6, c: 0, val: 7}, {r: 6, c: 2, val: 1}, {r: 6, c: 3, val: 2}, 
            {r: 6, c: 4, val: 3}, {r: 6, c: 5, val: 5}, {r: 6, c: 6, val: 6}, {r: 6, c: 7, val: 9},
            {r: 5, c: 1, val: [4, 1]}, 
        ]),
        hintHighlights: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[1][1] = true; arr[1][8] = true;
            arr[6][1] = true; arr[6][8] = true;
            return arr;
        })(),
        mistakes: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[5][1] = true; 
            return arr;
        })()
    },
    wings: { 
        id: 'wings', 
        label: 'Wings', 
        title: 'XY-Wing (Y-Wing)', 
        text: (
            <>
                <p style={{ marginTop: 0 }}>An <strong>XY-Wing</strong> uses three cells that each have only two candidates. One "Pivot" cell connects to two "Pincer" cells.</p>
                <p>The Pivot (Center) is <strong>[5, 7]</strong>. </p>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <li>If the Pivot is <strong>5</strong>, the left Pincer must be <strong>2</strong>.</li>
                    <li>If the Pivot is <strong>7</strong>, the top Pincer must be <strong>2</strong>.</li>
                </ul>
                <p>In either case, one of the Pincers <strong>must be 2</strong>. Any cell that sees <i>both</i> Pincers (the red cell) cannot contain a 2.</p>
            </>
        ),
        gridData: fillGrid([
            // Pivot
            {r: 4, c: 4, val: [5, 7]}, 
            // Pincer 1 (Row neighbor)
            {r: 4, c: 1, val: [5, 2]},
            // Pincer 2 (Column neighbor)
            {r: 1, c: 4, val: [7, 2]},
            
            // The Target (Intersection of Pincers)
            {r: 1, c: 1, val: [2, 9]}, 

            // Visual Noise/Context
            {r: 0, c: 0, val: 8}, {r: 0, c: 1, val: 3}, {r: 1, c: 0, val: 6},
            {r: 3, c: 3, val: 1}, {r: 5, c: 5, val: 4}
        ]),
        hintHighlights: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[4][4] = true; // Pivot
            arr[4][1] = true; // Pincer
            arr[1][4] = true; // Pincer
            return arr;
        })(),
        highlightedAreas: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            // Highlight the lines connecting them
            for(let i=1; i<=4; i++) arr[4][i] = true; // Row connection
            for(let i=1; i<=4; i++) arr[i][4] = true; // Col connection
            return arr;
        })(),
        mistakes: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[1][1] = true; 
            return arr;
        })()
    },
    unique: { 
        id: 'unique', 
        label: 'Unique rectangles', 
        title: 'Unique Rectangle (Type 1)', 
        text: (
            <>
                <p style={{ marginTop: 0 }}>Every Sudoku puzzle must have exactly one solution. A "Deadly Pattern" occurs if four cells forming a rectangle contain only the same two candidates (e.g., [1, 9]). This would allow two solutions, which is invalid.</p>
                <p>Look at the rectangle formed by the purple cells. They all contain <strong>[1, 9]</strong>. </p>
                <p>The fourth corner (Red) currently has candidates <strong>[1, 9, 5]</strong>.</p>
                <p>If that cell were 1 or 9, we would have a Deadly Pattern. To avoid this, the cell <strong>must</strong> be 5.</p>
            </>
        ), 
        gridData: fillGrid([
            // Floor 1
            {r: 2, c: 1, val: [1, 9]}, 
            {r: 2, c: 6, val: [1, 9]},
            
            // Floor 2
            {r: 7, c: 1, val: [1, 9]},
            // Target Corner
            {r: 7, c: 6, val: [1, 9, 5]},

            // Context
            {r: 2, c: 0, val: 4}, {r: 7, c: 0, val: 3},
            {r: 2, c: 7, val: 8}, {r: 7, c: 7, val: 2}
        ]),
        hintHighlights: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[2][1] = true; 
            arr[2][6] = true;
            arr[7][1] = true;
            return arr;
        })(),
        mistakes: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[7][6] = true; // Highlighting the cell where 1,9 are mistakes
            return arr;
        })()
    },
    chains: { 
        id: 'chains', 
        label: 'Forcing chains', 
        title: 'XY-Chain', 
        text: (
            <>
                <p style={{ marginTop: 0 }}>An <strong>XY-Chain</strong> connects multiple bivalue cells. We start at one end and trace the implications.</p>
                <p>Start at the top cell (Start): <strong>[1, 2]</strong>.</p>
                <p>If Start is <strong>1</strong>, we are done. If Start is NOT 1, it must be 2 → Middle becomes 5 → End becomes <strong>1</strong>.</p>
                <p>Regardless of the path, either the Start or the End contains a <strong>1</strong>. Therefore, any cell that sees <i>both</i> ends (the Red cell) cannot contain a 1.</p>
            </>
        ), 
        gridData: fillGrid([
            // Link 1 (Start)
            {r: 2, c: 2, val: [1, 2]},
            // Link 2 (Middle)
            {r: 2, c: 6, val: [2, 5]},
            // Link 3 (End)
            {r: 6, c: 6, val: [5, 1]},
            
            // Target Intersection
            {r: 6, c: 2, val: [1, 9]},

            // Context
            {r: 2, c: 0, val: 8}, {r: 6, c: 0, val: 7}
        ]),
        hintHighlights: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[2][2] = true; 
            arr[2][6] = true;
            arr[6][6] = true;
            return arr;
        })(),
        highlightedAreas: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            // Visualize the chain links
            for(let i=2; i<=6; i++) arr[2][i] = true; // Row link
            for(let i=2; i<=6; i++) arr[i][6] = true; // Col link
            return arr;
        })(),
        mistakes: (() => {
            const arr = Array(9).fill(null).map(() => Array(9).fill(false));
            arr[6][2] = true; 
            return arr;
        })()
    },
};

/**
 * @brief Array of keys for iterating through the strategy content.
 */
const STRATEGY_KEYS = Object.keys(STRATEGY_CONTENT);

/**
 * @brief Main component for the Sudoku Strategy guide page.
 * @returns {JSX.Element} The Strategy component.
 */
function Strategy() {
  const { goBack } = useSudokuNavigation();
  /** @brief State for the currently active strategy tab. */
  const [activeTab, setActiveTab] = useState('rules');
  /** @brief Hook to measure the size of the container element. */
  const [ref, bounds] = useMeasure();

  const currentContent = STRATEGY_CONTENT[activeTab];

  /**
   * @brief Handles navigation to the next strategy tab in the sequence.
   */
  const handleNext = () => {
    const currentIndex = STRATEGY_KEYS.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % STRATEGY_KEYS.length;
    setActiveTab(STRATEGY_KEYS[nextIndex]);
  };

  /** @brief Check if the current view width is considered mobile. */
  const isMobile = bounds.width < 900;
  
  /** @brief Styles for the main content layout (text + grid). */
  const layoutContainerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '2rem',
    alignItems: isMobile ? 'center' : 'flex-start', 
    justifyContent: 'center',
    width: '100%',
  };

  /** @brief Styles for the Sudoku grid wrapper. */
  const gridWrapperStyle = {
    width: isMobile ? '80%' : '45%',
    maxWidth: '450px', 
    aspectRatio: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0, 
  };

  /** @brief Styles for the text explanation card. */
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
    width: isMobile ? '100%' : 'auto', 
    minWidth: 0, 
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