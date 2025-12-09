import React, { useState, useEffect } from 'react';

/**
 * TIC_TAC_TOE COMPONENT
 * 
 * Similar structure to Sudoku, but for Tic_Tac_Toe.
 * Developer 2 works in this file independently.
 * 
 * This demonstrates how each game can be developed separately
 * with the same patterns but different game logic.
 */

function Tic_Tac_Toe() {
  // STATE
  const [score, setScore] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [newScore, setNewScore] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // FETCH DATA ON MOUNT
  useEffect(() => {
    fetchScore();
  }, []);

  const fetchScore = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/tic_tac_toe/score`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch score');
      }
      
      const data = await response.json();
      setScore(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching score:', err);
      setError('Failed to load score');
      setLoading(false);
    }
  };

  // SUBMIT SCORE
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    
    if (!playerName || !newScore) {
      setMessage('Please enter both player name and score');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/tic_tac_toe/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player: playerName,
          score: parseInt(newScore)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`Success! Score ${data.saved_score} saved for Tic_Tac_Toe!`);
        fetchScore();
        setPlayerName('');
        setNewScore('');
      }
    } catch (err) {
      console.error('Error saving score:', err);
      setMessage('Failed to save score');
    }
  };

  // STYLES
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto'
    },
    title: {
      fontSize: '2.5rem',
      color: '#ff6b9d',
      marginBottom: '2rem'
    },
    section: {
      backgroundColor: '#3a3f4b',
      padding: '2rem',
      borderRadius: '8px',
      marginBottom: '2rem'
    },
    subtitle: {
      fontSize: '1.5rem',
      color: '#ff6b9d',
      marginBottom: '1rem'
    },
    scoreInfo: {
      fontSize: '1.2rem',
      margin: '0.5rem 0'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    input: {
      padding: '0.75rem',
      fontSize: '1rem',
      borderRadius: '4px',
      border: '2px solid #ff6b9d',
      backgroundColor: '#282c34',
      color: 'white'
    },
    button: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      backgroundColor: '#ff6b9d',
      color: '#282c34',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    message: {
      padding: '1rem',
      borderRadius: '4px',
      backgroundColor: '#5f4a4a',
      color: '#f0a0a0',
      marginTop: '1rem'
    },
    loading: {
      fontSize: '1.5rem',
      color: '#ff6b9d',
      textAlign: 'center'
    },
    error: {
      fontSize: '1.5rem',
      color: '#ff6b6b',
      textAlign: 'center'
    }
  };

  // CONDITIONAL RENDERING
  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Loading Tic_Tac_Toe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  // MAIN RENDER
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Tic_Tac_Toe</h1>

      {/* Current Score Section */}
      <div style={styles.section}>
        <h2 style={styles.subtitle}>Current Score</h2>
        {score && (
          <div>
            <p style={styles.scoreInfo}>Player: {score.player}</p>
            <p style={styles.scoreInfo}>Score: {score.score}</p>
            <p style={styles.scoreInfo}>Level: {score.level}</p>
          </div>
        )}
      </div>

      {/* Submit New Score Section */}
      <div style={styles.section}>
        <h2 style={styles.subtitle}>Submit Your Score</h2>
        <form onSubmit={handleSubmitScore} style={styles.form}>
          <input
            type="text"
            placeholder="Player Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={styles.input}
          />
          <input
            type="number"
            placeholder="Score"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Submit Score
          </button>
        </form>
        {message && <div style={styles.message}>{message}</div>}
      </div>

      {/* Game-specific content here */}
      <div style={styles.section}>
        <h2 style={styles.subtitle}>Tic_Tac_Toe Specific Features</h2>
        <p style={styles.scoreInfo}>
          Developer 2: Add your game-specific UI and logic here!
        </p>
      </div>
    </div>
  );
}

export default Tic_Tac_Toe;