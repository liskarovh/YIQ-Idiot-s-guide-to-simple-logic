import React from 'react';
import styles from '../Styles';
import colors from '../Colors'

/**
 * GAME CARD COMPONENT - Displays a game option
 * 
 * Props:
 * - title: string - Game title
 * - description: string - Game description
 * - image: string - Path to game icon/image
 * - onClick: function - Callback when card is clicked
 */

function GameCard({ title, description, image, onClick }) {
  const cardStyle = {
    width: '480px',
    height: '300px',
    borderRadius: '30px',
    background: `linear-gradient(to , 
      ${colors.secondary} 0%, 
      ${colors.primary} 20%, 
      ${colors.primary} 60%, 
      ${colors.secondary} 100%)`,
    border: `2px solid ${colors.secondary}`,
    boxShadow: '-2px 4px 4px rgba(255, 255, 255, 0.1)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  const topSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  const imageStyle = {
    width: '60px',
    height: '60px',
    objectFit: 'contain',
  };

  const titleStyle = {
    fontSize: '36px',
    fontWeight: '400',
    color: colors.text_header,
    margin: 0,
  };

  const descriptionStyle = {
    fontSize: '18px',
    fontWeight: '400',
    color: colors.text,
    margin: 0,
    flex: 1,
  };

  const playNowStyle = {
    fontSize: '18px',
    fontWeight: '400',
    color: colors.text_faded,
    margin: 0,
  };

  return (
    <div 
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '-2px 8px 8px rgba(255, 255, 255, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '-2px 4px 4px rgba(255, 255, 255, 0.1)';
      }}
    >
      <div style={topSectionStyle}>
        <img src={image} alt={title} style={imageStyle} />
        <h3 style={titleStyle}>{title}</h3>
      </div>
      
      <p style={descriptionStyle}>
        {description}
      </p>
      
      <p style={playNowStyle}>
        Play now
      </p>
    </div>
  );
}

export default GameCard;