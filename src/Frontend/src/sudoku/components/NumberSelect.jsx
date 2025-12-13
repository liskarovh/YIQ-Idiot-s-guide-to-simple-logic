import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities'; // You can remove this import now as we removed the transform
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

  // FIXED: We removed the 'transform' property.
  // Since Game.jsx uses a <DragOverlay>, we want the source item 
  // to stay in place but look "empty" (opacity lowered).
  const combinedStyle = {
    ...style,
    opacity: isDragging ? 0.3 : (isHovered ? 0.8 : 1), 
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
    cursor: 'grab', 
    transition: 'background-color 0.2s, outline 0.2s', 
    backgroundColor: number === selectedNumber ? '#FFFFFF' : colors.text_faded,
    outline: `3px solid ${number === selectedNumber ? colors.text_faded : '#FFFFFF' }`,
    containerType: 'size',
  });

  const getTextStyle = (number) => {
    const contains = completedNumbers.includes(number);
    return {
      fontSize: '75cqmin',
      fontWeight: '500',
      color: contains ? colors.primary : '#FFFFFF',
      WebkitTextStroke: contains ? '#FFFFFF' : '2cqmin black', 
      textStroke: contains ? '#FFFFFF' : '2cqmin black', 
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