import React from 'react';
import colors from '../Colors';

/**
 * BOX COMPONENT - Container for content
 * 
 * Props:
 * - width: string - Box width (e.g., '600px', '100%')
 * - height: string - Box height (e.g., '400px', 'auto')
 * - children: ReactNode - Content inside the box
 * - style: object - Additional custom styles (optional)
 */

function Box({ width, height, children, style = {} }) {
  const boxStyle = {
    width: width,
    height: height,
    borderRadius: '40px',
    backgroundColor: colors.secondary,
    boxShadow: '-4px 2px 4px rgba(255, 255, 255, 0.25)',
    padding: '2rem',
    ...style,  // Allows additional custom styles to be passed in
  };

  return (
    <div style={boxStyle}>
      {children}
    </div>
  );
}

export default Box;