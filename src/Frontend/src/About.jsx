import React from 'react';
import styles from './Styles';
import Header from './components/Header'
import { useNavigate } from 'react-router-dom';
import Box from './components/Box';

/**
 * HOME COMPONENT - Landing page
 *
 * Clean page with gradient background using colors from Styles
 */

function About() {
  // Container style with gradient background
  const navigate = useNavigate();

  const contentStyle = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    textAlign: 'center',
    padding: '5rem 2rem 2rem 2rem',
    gap: '2rem',
  };

  return (
    <div>
      <Header
        showBack={true}
        onNavigate={() => navigate('/')}
      />
      <div style={contentStyle}>
        <Box width={'600px'} height={'400px'}>
            Hello
        </Box>
        <Box width={'600px'} height={'400px'}>
            Hello2
        </Box>
      </div>
    </div>
  );
}

export default About;
