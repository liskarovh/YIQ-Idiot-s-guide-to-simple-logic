import React from 'react';
import colors from '../Colors';

/**
 * BUTTON SELECT COMPONENT - Custom select that looks like buttons
 * 
 * Props:
 * - options: array of strings - Available options
 * - selected: string - Currently selected option
 * - onChange: function - Called with selected option value
 */

function ButtonSelect({ options, selected, onChange }) {
  const containerStyle = {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  };

  const getButtonStyle = (option) => ({
    padding: '0.5rem 0.75rem',
    borderRadius: '20px',
    fontSize: '28px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: option === selected ? '#FFFFFF' : colors.text_faded,
    color: option === selected ? colors.primary : colors.text,
  });

  return (
    <div style={containerStyle}>
      {options.map((option) => (
        <button
          key={option}
          style={getButtonStyle(option)}
          onClick={() => onChange(option)}
          onMouseEnter={(e) => {
            if (option !== selected) {
              e.currentTarget.style.opacity = '0.8';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default ButtonSelect;