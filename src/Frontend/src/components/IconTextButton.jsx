/**
 * @file IconTextButton.jsx
 * @brief A button component that displays text with an optional icon.
 *
 * @author David Krejčí \<xkrejcd00>
 */

import React from 'react';
import colors from '../Colors';

/**
 * TEXT BUTTON COMPONENT - Button with text and optional icon
 *
 * Props:
 * - text: string - Button text
 * - icon: string - Path to icon image (optional)
 * - iconRight: boolean - If true, icon appears on right; if false/undefined, on left
 * - onClick: function - Click handler (optional)
 */

function IconTextButton({ text, icon, iconRight = false, onClick, style = {} }) {
  const buttonStyle = {
    backgroundColor: colors.secondary,
    borderRadius: '30px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '-8px 5px 5px rgba(255, 255, 255, 0.3)',
    padding: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.2s, box-shadow 0.2s',
    flexDirection: iconRight ? 'row-reverse' : 'row',
    ...style
  };

  const textStyle = {
    fontSize: '64px',
    fontWeight: '700',
    color: '#FFFFFF',
    margin: 0,
  };

  const iconStyle = {
    width: '64px',
    height: '64px',
    objectFit: 'contain',
  };

  return (
    <div
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '-8px 8px 8px rgba(255, 255, 255, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '-8px 5px 5px rgba(255, 255, 255, 0.3)';
        }
      }}
    >
      {icon && <img src={icon} alt="" style={iconStyle} />}
      <span style={textStyle}>{text}</span>
    </div>
  );
}

export default IconTextButton;
