import React from "react";

const IconButton = ({ icon: Icon, description, onClick }) => {
  const buttonStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  };

  const iconStyle = {
    fontSize: '2.25rem',
    color: 'white',
  };

  const descriptionStyle = {
    color: 'white',
    fontSize: '1.25rem',
    fontWeight: 500,
    textAlign: 'center',
    whiteSpace: 'normal',
    maxWidth: '100px',
  };

  return (
    <button onClick={onClick} style={buttonStyle}>
      {typeof Icon === 'string' ? (
        <span style={iconStyle}>{Icon}</span>
      ) : (
        <Icon size={32} color="white" />
      )}
      <span style={descriptionStyle}>{description}</span>
    </button>
  );
};

export default IconButton;
