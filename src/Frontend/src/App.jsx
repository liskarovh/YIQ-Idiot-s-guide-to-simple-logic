import React, { useState, useEffect } from 'react';

function App() {
  const [message, setMessage] = useState('Loading...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    fetch(`${apiUrl}/api/hello`)
      .then(response => response.json())
      .then(data => {
        setMessage(data.message);
      })
      .catch(err => {
        setError('Failed to connect to backend');
        console.error('Error:', err);
      });
  }, []);

  const styles = {
    app: {
      textAlign: 'center'
    },
    header: {
      backgroundColor: '#282c34',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'calc(10px + 2vmin)',
      color: 'white'
    },
    messageBox: {
      marginTop: '2rem',
      padding: '2rem',
      backgroundColor: '#3a3f4b',
      borderRadius: '8px',
      minWidth: '400px'
    },
    message: {
      color: '#61dafb',
      fontSize: '1.2rem',
      margin: 0
    },
    error: {
      color: '#ff6b6b',
      fontSize: '1.2rem',
      margin: 0
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1>React + Python Hello World</h1>
        <div style={styles.messageBox}>
          {error ? (
            <p style={styles.error}>{error}</p>
          ) : (
            <p style={styles.message}>{message}</p>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;