import React from 'react';
import colors from '../../Colors';

/**
 * NUMBER SELECTOR COMPONENT
 * 
 * Props:
 * - selectedNumber: number (1-9) - Currently selected number
 * - onNumberSelect: function(number) - Called when a number is clicked
 * - isColumn: boolean - If true, layout vertically; if false, layout horizontally
 */

function NumberSelector({ selectedNumber, onNumberSelect, completedNumbers=[], isColumn = true, style = {} }) {
  const containerStyle = {
    display: 'flex',
    flexDirection: isColumn ? 'column' : 'row',
    gap: '3%',
    alignItems: 'center',
    width: isColumn ? '150px' : '100%',
    height: isColumn ? '100%' : '150px',
    padding: isColumn ? "3px 0px" : "0px 3px",
    boxSizing: 'border-box',
    ...style
  };

  const getNumberStyle = (number) => ({
    flex: 1,
    width: isColumn ? '100%' : 'auto',
    height: isColumn ? 'auto' : '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: number === selectedNumber ? '#FFFFFF' : colors.text_faded,
    outline: `3px solid ${number === selectedNumber ? colors.text_faded : '#FFFFFF' }`,
    containerType: 'size',
  });

  const getTextStyle = (number) => {
    const contains = completedNumbers.includes(number)
    return {
      fontSize: '75cqmin',
      fontWeight: '500',
      color: contains ? colors.primary : '#FFFFFF',
      WebkitTextStroke: contains ? '#FFFFFF' : '2cqmin black', 
      textStroke: contains ? '#FFFFFF' : '2cqmin black', 
      userSelect: 'none',
    }
  };

  return (
    <div style={containerStyle}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => (
        <div
          key={number}
          style={getNumberStyle(number)}
          onClick={() => onNumberSelect(number)}
          onMouseEnter={(e) => {
            if (number !== selectedNumber) {
              e.currentTarget.style.opacity = '0.8';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span style={getTextStyle(number)}>{number}</span>
        </div>
      ))}
    </div>
  );
}

export default NumberSelector;
