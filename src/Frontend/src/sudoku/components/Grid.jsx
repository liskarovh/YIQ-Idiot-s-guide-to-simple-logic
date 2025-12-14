/**
 * @file Grid.jsx
 * @brief Components for rendering the Sudoku grid, including individual cells with visual logic for selection, drag/drop, hints, mistakes, and highlighting.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

/**
 * @brief Renders a single cell in the Sudoku grid.
 * @param {object} props - The component props.
 * @param {number|number[]} props.value - The cell value (number or array of pencil marks).
 * @param {string} props.type - The cell type ("Given", "Value", "Pencil").
 * @param {number} props.row - The cell's row index.
 * @param {number} props.col - The cell's column index.
 * @param {boolean} props.isSelected - True if the cell is currently selected.
 * @param {boolean} props.isHint - True if the cell is highlighted as part of a hint.
 * @param {boolean} props.isHighlightedArea - True if the cell is in the selected row/col/box.
 * @param {boolean} props.isHighlightedNumber - True if the cell contains the selected number.
 * @param {boolean} props.isMistake - True if the cell is marked as incorrect.
 * @param {function} props.onClick - Handler for cell click events.
 * @returns {JSX.Element} The SudokuCell component.
 */
function SudokuCell({ value, type, row, col, isSelected, isHint, isHighlightedArea, isHighlightedNumber, isMistake, onClick }) {
  const cellId = `cell-${row}-${col}`;

  // 1. Get isOver to show visual feedback when dragging
  /** @brief Hook to make the cell a drop target for DndContext. */
  const { setNodeRef, isOver } = useDroppable({
    id: cellId,
  });

  // Determine which 3x3 box this cell belongs to
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  const boxIndex = boxRow * 3 + boxCol;

  /** @brief Color palette for visual feedback. */
  const COLORS = {
    white: '255, 255, 255',
    red: '255, 85, 85',
    blue: '80, 150, 255',
    gold: '255, 207, 76',
    purple: '160, 140, 255'
  };
  
  const isDarkBox = boxIndex % 2 === 0; 
  const baseAlpha = isDarkBox ? 0.08 : 0.16;

    // -- STYLE LOGIC --
  /**
   * @brief Determines the background color and text priority based on the cell state.
   * @returns {object} Object containing background, text color, and font weight.
   */
  const getCellAppearance = () => {
    const textColor = type == "Given" ? '#d8e0ebff' : '#FFFFFF'
    
    // 0. DRAG OVER (Highest Priority)
    if (isOver) {
        return {
            backgroundColor: `rgba(${COLORS.blue}, 0.6)`,
            textColor,
            fontWeight: '600'
        };
    }

    // 1. MISTAKE
    if (isMistake) {
        return {
            backgroundColor: `rgba(${COLORS.red}, 0.6)`,
            textColor,
            fontWeight: '700'
        };
    }

    // 2. HINT
    if (isHint) {
        return {
            backgroundColor: `rgba(${COLORS.purple}, 0.6)`,
            textColor,
            fontWeight: '700'
        };
    }

    // 3. SELECTED CELL
    if (isSelected) {
        return {
            backgroundColor: `rgba(${COLORS.blue}, 0.5)`,
            textColor,
            fontWeight: '600'
        };
    }

    // 4. SAME NUMBER
    if (isHighlightedNumber) {
        return {
            backgroundColor: `rgba(${COLORS.blue}, 0.3)`,
            textColor,
            fontWeight: '600'
        };
    }

    // 5. HIGHLIGHTED AREA
    if (isHighlightedArea) {
        return {
            backgroundColor: `rgba(${COLORS.white}, ${(baseAlpha) + 0.25})`,
            textColor,
            fontWeight: '400'
        };
    }

    // 6. DEFAULT
    return {
        backgroundColor: `rgba(${COLORS.white}, ${baseAlpha})`,
        textColor,
        fontWeight: '400'
    };
  };

  const appearance = getCellAppearance();
    
  // Border logic for thick/thin lines
  const borderColor = isSelected ? 'rgba(255, 207, 76, 1)' : 'rgba(255, 255, 255, 0.6)'
  const outline = isSelected ? '0.15cqmin solid rgba(255, 207, 76, 1)' : 'none'

  const zIndex = isSelected ? 10 : 1;
  const thinBorder = '0.08cqmin solid ' + borderColor;
  const thickBorder = '0.6cqmin solid ' + borderColor;
  const borderTop = row % 3 === 0 || isSelected ? thickBorder : thinBorder;
  const borderLeft = col % 3 === 0 || isSelected ? thickBorder : thinBorder;
  const borderRight = (col + 1) % 3 === 0 || isSelected ? thickBorder : thinBorder;
  const borderBottom = (row + 1) % 3 === 0 || isSelected ? thickBorder : thinBorder;
  
  const cellStyle = {
    width: '100%',
    height: '100%',
    aspectRatio: '1',
    backgroundColor: appearance.backgroundColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-out',
    boxSizing: 'border-box',
    containerType: 'size',
    position: 'relative',
    zIndex: zIndex,
    outline,
    outlineOffset: '-0.2cqmin',
    borderTop,
    borderLeft,
    borderRight,
    borderBottom,
  };
  
  const textStyle = {
    fontSize: '70cqmin',
    fontWeight: type == "Given" ? '700' : '500',
    color: appearance.textColor,
    WebkitTextStroke: type == "Given" ? '3cqmin black' : 'none',
    userSelect: 'none',
  };

  const pencilTextStyle = {
    fontSize: '25cqmin',
    fontWeight: '500',
    color: appearance.textColor,
  };

  const pencilGridStyle = {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      width: '100%',
      height: '100%',
      padding: '3cqmin',
    };
    
    const pencilCellStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Render logic based on cell type (Value vs. Pencil)
    if (type === "Pencil") {
        return (
            <div ref={setNodeRef} style={cellStyle} onClick={() => onClick(row, col)}>
                <div style={pencilGridStyle}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <div key={num} style={pencilCellStyle}>
                    {value && value.includes(num) && (
                        <span style={pencilTextStyle}>{num}</span>
                    )}
                    </div>
                ))}
                </div>
            </div>
        );
    } else {
        return (
            <div ref={setNodeRef} style={cellStyle} onClick={() => onClick(row, col)}>
            {value && <span style={textStyle}>{value}</span>}
            </div>
        );
    }
}

/**
 * @brief Renders the 9x9 Sudoku grid container and maps data to individual cells.
 * @param {object} props - The component props.
 * @param {Array<Array<object>>} props.gridData - The 9x9 array of cell data {value, type}.
 * @param {object} props.selectedCell - The {row, col} of the selected cell.
 * @param {boolean[][]} [props.highlightedNumbers] - 9x9 boolean array for highlighting same numbers.
 * @param {boolean[][]} [props.highlightedAreas] - 9x9 boolean array for highlighting row/col/box.
 * @param {boolean[][]} [props.mistakes] - 9x9 boolean array for mistake cells.
 * @param {boolean[][]} [props.hintHighlights] - 9x9 boolean array for hint highlights.
 * @param {function} props.onCellClick - Handler for cell clicks.
 * @returns {JSX.Element} The SudokuGrid component.
 */
function SudokuGrid({ 
  gridData, 
  selectedCell, 
  highlightedNumbers = Array(9).fill(null).map(() => Array(9).fill(false)),
  highlightedAreas = Array(9).fill(null).map(() => Array(9).fill(false)), 
  mistakes = Array(9).fill(null).map(() => Array(9).fill(false)),
  hintHighlights = null,
  onCellClick 
}) {
  const gridWrapperStyle = {
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
    aspectRatio: '1 / 1',
    display: 'flex',
    boxSizing: 'border-box',
    containerType: 'size',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(9, 1fr)',
    gridTemplateRows: 'repeat(9, 1fr)',
    width: 'auto',
    height: 'auto',
    boxSizing: 'border-box',
    border: '0.4cqh solid rgba(255,255,255,0.9)',
    borderRadius: '1cqmin',
  };

  return (
    <div style={gridWrapperStyle}>
      <div style={gridStyle}>
        {gridData.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected =
              selectedCell &&
              selectedCell.row === rowIndex &&
              selectedCell.col === colIndex;
            const isHighlightedNumber = highlightedNumbers[rowIndex][colIndex]
            const isHighlightedArea = highlightedAreas[rowIndex][colIndex]
            const isMistake = mistakes[rowIndex][colIndex]
            const isHint = hintHighlights && hintHighlights[rowIndex][colIndex];

            return (
              <SudokuCell
                key={`${rowIndex}-${colIndex}`} 
                value={cell.value}
                type={cell.type}
                row={rowIndex}
                col={colIndex}
                isSelected={isSelected}
                isHighlightedNumber={isHighlightedNumber}
                isHighlightedArea={isHighlightedArea}
                isMistake={isMistake}
                isHint={isHint}
                onClick={onCellClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default SudokuGrid;