import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * HOME COMPONENT - Landing page with game selection
 * 
 * This component demonstrates:
 * - useState: Managing component state
 * - useEffect: Fetching data when component loads
 * - Conditional rendering: Showing different UI based on state
 * - Mapping arrays: Creating lists of elements
 */

function Home() {
  // STATE MANAGEMENT
  // useState returns [currentValue, updateFunction]
  const [games, setGames] = useState([]);  // Array of games from backend
  const [loading, setLoading] = useState(true);  // Loading status
  const [error, setError] = useState(null);  // Error message if fetch fails

  // SIDE EFFECT - Fetch games from backend when component loads
  useEffect(() => {
    // Get API URL from environment variable or use default
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Fetch data from backend
    fetch(`${apiUrl}/api/games`)
      .then(response => {
        // Check if request was successful
        if (!response.ok) {
          throw new Error('Failed to fetch games');
        }
        return response.json();  // Parse JSON response
      })
      .then(data => {
        // Success! Update state with games data
        setGames(data.games);
        setLoading(false);
      })
      .catch(err => {
        // Error occurred, update error state
        console.error('Error fetching games:', err);
        setError('Failed to load games');
        setLoading(false);
      });
  }, []); // Empty array means: run only once when component mounts

  // STYLES
  const styles = {
    container: {
      textAlign: 'center',
      maxWidth: '800px',
      margin: '0 auto'
    },
    title: {
      fontSize: '3rem',
      marginBottom: '2rem',
      color: '#61dafb'
    },
    subtitle: {
      fontSize: '1.5rem',
      marginBottom: '3rem',
      color: '#a0a0a0'
    },
    gamesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem',
      padding: '2rem 0'
    },
    gameCard: {
      backgroundColor: '#3a3f4b',
      padding: '2rem',
      borderRadius: '8px',
      textDecoration: 'none',
      color: 'white',
      transition: 'transform 0.3s, box-shadow 0.3s',
      cursor: 'pointer'
    },
    gameCardHover: {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 16px rgba(97, 218, 251, 0.3)'
    },
    gameName: {
      fontSize: '1.5rem',
      margin: '0',
      color: '#61dafb'
    },
    loading: {
      fontSize: '1.5rem',
      color: '#61dafb'
    },
    error: {
      fontSize: '1.5rem',
      color: '#ff6b6b'
    }
  };

  // CONDITIONAL RENDERING
  // Show different UI based on loading/error/success states
  
  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Loading games...</p>
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
      <h1 style={styles.title}>Welcome to Game Hub</h1>
      <p style={styles.subtitle}>Choose a game to play</p>

      {/* MAP ARRAY TO COMPONENTS */}
      {/* .map() creates a new array by transforming each element */}
      <div style={styles.gamesGrid}>
        {games.map((game) => (
          // Each element in a list needs a unique "key" prop
          // Link creates a navigation link without page reload
          <Link
            key={game.id}
            to={game.path}
            style={styles.gameCard}
            onMouseEnter={(e) => {
              // Hover effect: change style on mouse enter
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(97, 218, 251, 0.3)';
            }}
            onMouseLeave={(e) => {
              // Reset style on mouse leave
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h2 style={styles.gameName}>{game.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;