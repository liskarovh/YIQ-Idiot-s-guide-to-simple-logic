import React from "react";

const IconButton = ({ icon: Icon, description, onClick, size=32, fontSize='1.25rem'}) => {
  const buttonStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '4px', // Reduced padding slightly to save space
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: 'fit-content'
  };

  const iconStyle = {
    fontSize: `${size}px`,
    color: 'white',
  };

  // Use the passed fontSize, or fallback to a calculation based on size, or default to 1rem
  const finalFontSize = fontSize || (size ? `${Math.max(10, size * 0.4)}px` : '1rem');

  const descriptionStyle = {
    color: 'white',
    fontSize: finalFontSize, 
    fontWeight: 500,
    textAlign: 'center',
    whiteSpace: 'normal',
    maxWidth: '100px',
    lineHeight: '1.1', // tighter line height helps with vertical space
  };

  return (
    <button onClick={onClick} style={buttonStyle}>
      {typeof Icon === 'string' ? (
        <span style={iconStyle}>{Icon}</span>
      ) : (
        <Icon size={size} color="white" />
      )}
      <span style={descriptionStyle}>{description}</span>
    </button>
  );
};

export default IconButton;