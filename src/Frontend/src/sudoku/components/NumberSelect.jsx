import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import colors from '../../Colors';

/**
 * INTERNAL COMPONENT: DRAGGABLE NUMBER
 */
function DraggableNumber({ number, style, textStyle, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: number.toString(),
    data: { number },
  });

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
 * MAIN COMPONENT: NUMBER SELECTOR
 */
function NumberSelector({ selectedNumber, onNumberSelect, completedNumbers = [], isColumn = true, style = {} }) {
  
  const containerStyle = {
    display: 'flex',
    flexDirection: isColumn ? 'column' : 'row',
    gap: '0.5rem', // Consistent gap with other UI
    alignItems: 'center',
    // Preserve layout sizing logic from Game.jsx
    width: isColumn ? '150px' : '100%',
    height: isColumn ? '100%' : '150px',
    padding: isColumn ? "3px 0px" : "0px 3px",
    boxSizing: 'border-box',
    ...style
  };

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
      borderRadius: '12px', // Consistent rounded corner
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

  const getTextStyle = (number) => {
    const isSelected = number === selectedNumber;
    
    // UNIFIED THEME COLORS
    const activeColor = '#0f172a'; // Dark text on light background
    const inactiveColor = '#ffffff';

    return {
      fontSize: '50cqmin', // Slightly reduced to breathe better inside the box
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