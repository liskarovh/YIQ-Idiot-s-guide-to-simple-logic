import React from 'react';
import { useDroppable } from '@dnd-kit/core';

function SudokuCell({ value, type, row, col, isSelected, isHint, isHighlightedArea, isHighlightedNumber, isMistake, onClick }) {
  const cellId = `cell-${row}-${col}`;

  // 1. Get isOver to show visual feedback when dragging
  const { setNodeRef, isOver } = useDroppable({
    id: cellId,
  });

  // Determine which 3x3 box this cell belongs to
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  const boxIndex = boxRow * 3 + boxCol;

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
  const getCellAppearance = () => {
    const textColor = type == "Given" ? '#d8e0ebff' : '#FFFFFF'
    
    // 0. DRAG OVER
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

    if (isHint) {
        return {
            backgroundColor: `rgba(${COLORS.purple}, 0.6)`,
            textColor,
            fontWeight: '700'
        };
    }

    // 2. SELECTED CELL
    if (isSelected) {
        return {
            backgroundColor: `rgba(${COLORS.blue}, 0.5)`,
            textColor,
            fontWeight: '600'
        };
    }

    // 3. SAME NUMBER
    if (isHighlightedNumber) {
        return {
            backgroundColor: `rgba(${COLORS.blue}, 0.3)`,
            textColor,
            fontWeight: '600'
        };
    }

    // 4. HIGHLIGHTED AREA
    if (isHighlightedArea) {
        return {
            backgroundColor: `rgba(${COLORS.white}, ${(baseAlpha) + 0.25})`,
            textColor,
            fontWeight: '400'
        };
    }

    // 5. DEFAULT
    return {
        backgroundColor: `rgba(${COLORS.white}, ${baseAlpha})`,
        textColor,
        fontWeight: '400'
    };
  };

  const appearance = getCellAppearance();
    
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

    // 2. ATTACH THE REF HERE (setNodeRef)
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
                key={`${rowIndex}-${colIndex}`} // Added key for React performance
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