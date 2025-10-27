import React, { useState, useEffect } from 'react';

/**
 * GAME 1 COMPONENT
 * 
 * This is a complete example showing:
 * - Fetching data from backend (GET request)
 * - Sending data to backend (POST request)
 * - Managing multiple state variables
 * - Event handlers (button clicks, input changes)
 * - Conditional rendering
 * 
 * Developer 1 works in this file for Game 1 logic
 */

function Sudoku() {
  // ============= STATE MANAGEMENT =============
  
  // Score from backend
  const [score, setScore] = useState(null);
  
  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Input for player name
  const [playerName, setPlayerName] = useState('');
  
  // New score to submit
  const [newScore, setNewScore] = useState('');
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // API base URL
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // ============= DATA FETCHING =============
  
  // Fetch initial data when component loads
  useEffect(() => {
    fetchScore();
    fetchLeaderboard();
  }, []); // Empty array = run once on mount

  // Function to fetch current score from backend
  const fetchScore = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/sudoku/score`);
      
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

  // Function to fetch leaderboard from backend
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/sudoku/leaderboard`);
      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  // ============= EVENT HANDLERS =============
  
  // Handle form submission - save new score to backend
  const handleSubmitScore = async (e) => {
    e.preventDefault(); // Prevent page reload on form submit
    
    // Validate inputs
    if (!playerName || !newScore) {
      setMessage('Please enter both player name and score');
      return;
    }

    try {
      // POST request to backend
      const response = await fetch(`${apiUrl}/api/sudoku/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Tell backend we're sending JSON
        },
        body: JSON.stringify({
          player: playerName,
          score: parseInt(newScore) // Convert string to number
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`Success! Score saved: ${data.saved_score}`);
        // Refresh data
        fetchScore();
        fetchLeaderboard();
        // Clear form
        setPlayerName('');
        setNewScore('');
      }
    } catch (err) {
      console.error('Error saving score:', err);
      setMessage('Failed to save score');
    }
  };

  // Handle input changes
  const handlePlayerNameChange = (e) => {
    setPlayerName(e.target.value);
  };

  const handleNewScoreChange = (e) => {
    setNewScore(e.target.value);
  };

  // ============= STYLES =============
  
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto'
    },
    title: {
      fontSize: '2.5rem',
      color: '#61dafb',
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
      color: '#61dafb',
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
      border: '2px solid #61dafb',
      backgroundColor: '#282c34',
      color: 'white'
    },
    button: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      backgroundColor: '#61dafb',
      color: '#282c34',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    message: {
      padding: '1rem',
      borderRadius: '4px',
      backgroundColor: '#4a5f4a',
      color: '#a0f0a0',
      marginTop: '1rem'
    },
    leaderboardTable: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeader: {
      backgroundColor: '#282c34',
      padding: '0.75rem',
      textAlign: 'left',
      color: '#61dafb'
    },
    tableCell: {
      padding: '0.75rem',
      borderBottom: '1px solid #282c34'
    },
    loading: {
      fontSize: '1.5rem',
      color: '#61dafb',
      textAlign: 'center'
    },
    error: {
      fontSize: '1.5rem',
      color: '#ff6b6b',
      textAlign: 'center'
    }
  };

  // ============= CONDITIONAL RENDERING =============
  
  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Loading Game 1...</p>
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

  // ============= MAIN RENDER =============
  
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Game 1</h1>

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
            onChange={handlePlayerNameChange}
            style={styles.input}
          />
          <input
            type="number"
            placeholder="Score"
            value={newScore}
            onChange={handleNewScoreChange}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Submit Score
          </button>
        </form>
        {message && <div style={styles.message}>{message}</div>}
      </div>

      {/* Leaderboard Section */}
      <div style={styles.section}>
        <h2 style={styles.subtitle}>Leaderboard</h2>
        <table style={styles.leaderboardTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Rank</th>
              <th style={styles.tableHeader}>Player</th>
              <th style={styles.tableHeader}>Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.rank}>
                <td style={styles.tableCell}>{entry.rank}</td>
                <td style={styles.tableCell}>{entry.player}</td>
                <td style={styles.tableCell}>{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Sudoku;