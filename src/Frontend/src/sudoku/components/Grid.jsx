import React from 'react';


function SudokuCell({ value, type, row, col, isSelected, isHint, isHighlightedArea, isHighlightedNumber, isMistake, onClick }) {
  // Determine which 3x3 box this cell belongs to
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  const boxIndex = boxRow * 3 + boxCol;
  
  // Alternating box opacity pattern
  const boxOpacities = [0.2, 0.3, 0.2, 0.3, 0.2, 0.3, 0.2, 0.3, 0.2];

    const highlightedAreaStyle = {
        backgroundColor: 'rgba(255, 255, 255, ' + (boxOpacities[boxIndex] + 0.15) + ')',
        textColor: '#FFFFFF',
    }

    const highlightedNumberStyle = {
        backgroundColor: 'rgba(175, 175, 255, ' + (boxOpacities[boxIndex]/2 + 0.3) + ')',
        textColor: '#FFFFFF',
    }

    const mistakeStyle = {
        backgroundColor: 'rgba(255, 200, 200, ' + boxOpacities[boxIndex] + ')',
        textColor: '#FF0000',
    }

    const hintStyle = {
        backgroundColor: 'rgba(230, 230, 255, ' + boxOpacities[boxIndex] + ')',
        textColor: '#029affff',
    }

    const defaultStyle = {
        backgroundColor: 'rgba(255, 255, 255,' + boxOpacities[boxIndex] + ')',
        textColor: '#FFFFFF'
    }

    let styleUsed
    if (isMistake) {
        styleUsed = mistakeStyle
    } else if (isHint) {
        styleUsed = hintStyle
      } else if (isHighlightedNumber) {
      styleUsed = highlightedNumberStyle
    } else if (isHighlightedArea) {
        styleUsed = highlightedAreaStyle
    } else {
        styleUsed = defaultStyle
    }
    
    const borderColor = isSelected ? 'rgba(255, 207, 76, 1)' : 'rgba(255,255,255,0.9)'
    const outline = isSelected ? '0.08cqh solid rgba(255, 207, 76, 1)' : 'none'

  const thinBorder = '0.08cqh solid ' + borderColor;
  const thickBorder = '0.6cqh solid ' + borderColor;
  
  const cellStyle = {
    width: '100%',
    height: '100%',
    aspectRatio: '1',
    backgroundColor: styleUsed.backgroundColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    boxSizing: 'border-box',
    containerType: 'size',
    outline,

    borderTop: row % 3 === 0 ? thickBorder : thinBorder,
    borderLeft: col % 3 === 0 ? thickBorder : thinBorder,
    borderRight: (col + 1) % 3 === 0 ? thickBorder : thinBorder,
    borderBottom: (row + 1) % 3 === 0 ? thickBorder : thinBorder,
  };
  
  const textStyle = {
    fontSize: '75cqmin',
    fontWeight: type == "Given" ? '700' : '500',
    color: styleUsed.textColor,
    WebkitTextStroke: type == "Given" ? '3cqmin black' : 'none',
    userSelect: 'none',
  };

  const pencilTextStyle = {
    fontSize: '100%',
    fontWeight: '500',
    color: styleUsed.textColor,
  };

  const pencilGridStyle = {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      width: '100%',
      height: '100%',
      padding: '4px',
    };
    
    const pencilCellStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (type === "Pencil") {
        return (
            <div style={cellStyle} onClick={() => onClick(row, col)}>
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
            <div style={cellStyle} onClick={() => onClick(row, col)}>
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
  hintCells = new Set(),
  onCellClick 
}) {
  const gridWrapperStyle = {
    width: '100%',
    height: '100%',
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
    borderRadius: '1cqh',
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
            const isHint = false;

            return (
              <SudokuCell
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
