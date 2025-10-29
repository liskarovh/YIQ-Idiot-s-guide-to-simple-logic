import React from 'react';
import colors from '../Colors';

/**
 * HEADER COMPONENT - Navigation header
 * 
 * Props:
 * - showBack: boolean - if true shows "Back", if false shows "About"
 * - onNavigate: function - callback when navigation link is clicked
 */

function Header({ showBack = false, onNavigate }) {
  const headerStyle = {
    width: '100%',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    boxSizing: 'border-box',
  };

  const leftSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  };

  const logoStyle = {
    fontSize: '50px',
    fontWeight: '800',
    color: colors.text_header,
    cursor: 'pointer',
  };

  const titleStyle = {
    fontSize: '30px',
    fontWeight: '600',
    color: colors.text,
  };

  const linkStyle = {
    fontSize: '30px',
    fontWeight: '600',
    color: colors.text,
    cursor: 'pointer',
    transition: 'color 0.2s',
  };

  return (
    <header style={headerStyle}>
      <div style={leftSectionStyle}>
        <span 
          style={logoStyle}
          onClick={() => onNavigate && onNavigate('/')}
        >
          yIQ
        </span>
        <span style={titleStyle}>
          Ydea impaired's quide to basic logic
        </span>
      </div>
      
      <span
        style={linkStyle}
        onClick={() => onNavigate && onNavigate(showBack ? 'back' : '/about')}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = colors.text_header;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = colors.text;
        }}
      >
        {showBack ? 'Back' : 'About'}
      </span>
    </header>
  );
}

export default Header;