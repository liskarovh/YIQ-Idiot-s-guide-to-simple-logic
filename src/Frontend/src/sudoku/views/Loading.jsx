import React from "react";
import Box from "../../components/Box";
import Header from "../../components/Header";
import colors from "../../Colors"; // Assuming Colors is available based on Game.jsx usage
import { useNavigate } from "react-router-dom";

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
};

const containerStyle = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingBottom: '10vh', // Visual offset to center it nicely
};

const loaderGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gridTemplateRows: 'repeat(3, 1fr)',
  gap: '8px',
  width: '80px',
  height: '80px',
  marginBottom: '1.5rem',
};

// Generate animation delays for a nice wave effect
const getDelay = (index) => {
  const delays = [0, 0.2, 0.4, 0.2, 0.4, 0.6, 0.4, 0.6, 0.8];
  return `${delays[index]}s`;
};

function Loading() {
  const navigate = useNavigate();
  
  return (
    <div style={pageStyle}>
      {/* Include Header for layout stability */}
      <Header showBack={true} onNavigate={() => navigate('/')}/> 

      {/* Inject CSS for the pulse animation */}
      <style>
        {`
          @keyframes sudokuPulse {
            0%, 100% { opacity: 0.3; transform: scale(0.95); }
            50% { opacity: 1; transform: scale(1.05); }
          }
          .loader-cell {
            background-color: ${colors.primary || '#4a90e2'};
            border-radius: 4px;
            animation: sudokuPulse 1.5s ease-in-out infinite;
          }
        `}
      </style>

      <div style={containerStyle}>
        <Box 
          width={300} 
          height={300} 
          style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}
        >
          {/* Thematic Sudoku 3x3 Loader */}
          <div style={loaderGridStyle}>
            {[...Array(9)].map((_, i) => (
              <div 
                key={i} 
                className="loader-cell"
                style={{ animationDelay: getDelay(i) }} 
              />
            ))}
          </div>

          <h2 style={{ 
            color: colors.text || '#fff', 
            margin: 0, 
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Loading...
          </h2>
          
          <p style={{ 
            color: 'rgba(255,255,255,0.6)', 
            marginTop: '0.5rem', 
            fontSize: '0.9rem' 
          }}>
            Preparing your puzzle
          </p>
        </Box>
      </div>
    </div>
  );
}

export default Loading;