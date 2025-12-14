/**
 * @file NumberSelect.jsx
 * @brief Component providing a draggable selector bar for numbers 1 through 9, used for inputting values into the Sudoku grid.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import colors from '../../Colors';

/**
 * @brief INTERNAL COMPONENT: A single draggable number button in the selector.
 * @param {object} props - The component props.
 * @param {number} props.number - The number displayed (1-9).
 * @param {object} props.style - The base CSS style for the div.
 * @param {object} props.textStyle - The CSS style for the number text.
 * @param {function} props.onClick - Handler for when the number is clicked.
 * @returns {JSX.Element} The DraggableNumber component.
 */
function DraggableNumber({ number, style, textStyle, onClick }) {
  /** @brief Hook to make the component draggable via DndContext. */
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: number.toString(),
    data: { number },
  });

  /** @brief State to handle hover visual feedback. */
  const [isHovered, setIsHovered] = useState(false);

  const combinedStyle = {
    ...style,
    // If dragging, leave a "ghost" behind (low opacity)
    // If hovered, brighten slightly
    opacity: isDragging ? 0.3 : (isHovered ? 1 : style.opacity), 
    transform: isHovered && !isDragging ? 'scale(1.05)' : 'scale(1)',
    touchAction: 'none', 
  };

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...listeners} 
      {...attributes}
      onClick={() => onClick(number)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={textStyle}>{number}</span>
    </div>
  );
}

/**
 * @brief MAIN COMPONENT: The container for the 1-9 number selector buttons.
 * @param {object} props - The component props.
 * @param {number} props.selectedNumber - The currently selected number (for highlighting).
 * @param {function} props.onNumberSelect - Handler for when a number is selected.
 * @param {number[]} [props.completedNumbers=[]] - Array of numbers that are completed and correct.
 * @param {boolean} [props.isColumn=true] - If true, displays numbers vertically; otherwise, horizontally.
 * @param {object} [props.style={}] - Custom styles for the container.
 * @returns {JSX.Element} The NumberSelector component.
 */
function NumberSelector({ selectedNumber, onNumberSelect, completedNumbers = [], isColumn = true, style = {} }) {
  
  /** @brief Styles for the main container, handling column/row layout. */
  const containerStyle = {
    display: 'flex',
    flexDirection: isColumn ? 'column' : 'row',
    gap: '0.5rem', 
    alignItems: 'center',
    width: isColumn ? '150px' : '100%',
    height: isColumn ? '100%' : '150px',
    padding: isColumn ? "3px 0px" : "0px 3px",
    boxSizing: 'border-box',
    ...style
  };

  /**
   * @brief Generates the dynamic visual style for an individual number button.
   * @param {number} number - The number being styled.
   * @returns {object} The style object.
   */
  const getNumberStyle = (number) => {
    const isSelected = number === selectedNumber;
    const isCompleted = completedNumbers.includes(number);

    // UNIFIED THEME COLORS
    const activeBg = '#d8e0eb';
    const inactiveBg = 'rgba(255, 255, 255, 0.1)';
    const completedBg = 'rgba(255, 255, 255, 0.02)'; // Very faint for completed

    return {
      flex: 1,
      width: isColumn ? '100%' : 'auto',
      height: isColumn ? 'auto' : '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '12px', 
      cursor: 'grab', 
      transition: 'all 0.2s ease', 
      
      // Visual Logic
      backgroundColor: isSelected ? activeBg : (isCompleted ? completedBg : inactiveBg),
      border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)',
      boxShadow: isSelected ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
      
      // Dim completed numbers if they aren't currently selected
      opacity: (isCompleted && !isSelected) ? 0.5 : 1,
      
      containerType: 'size',
    };
  };

  /**
   * @brief Generates the dynamic style for the number text inside the button.
   * @param {number} number - The number being styled.
   * @returns {object} The style object.
   */
  const getTextStyle = (number) => {
    const isSelected = number === selectedNumber;
    
    // UNIFIED THEME COLORS
    const activeColor = '#0f172a'; // Dark text on light background
    const inactiveColor = '#ffffff';

    return {
      fontSize: '50cqmin', 
      fontWeight: isSelected ? '700' : '500',
      color: isSelected ? activeColor : inactiveColor,
      userSelect: 'none',
    };
  };

  return (
    <div style={containerStyle}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => (
        <DraggableNumber
          key={number}
          number={number}
          style={getNumberStyle(number)}
          textStyle={getTextStyle(number)}
          onClick={onNumberSelect}
        />
      ))}
    </div>
  );
}

export default NumberSelector;