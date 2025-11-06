import React from 'react';
import styles from './Styles';
import Header from './components/Header'
import GameCard from './components/GameCard';
import { useNavigate } from 'react-router-dom';

/**
 * HOME COMPONENT - Landing page
 *
 * Clean page with gradient background using colors from Styles
 */

function Home() {
  // Container style with gradient background
  const navigate = useNavigate();

  const contentStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '5rem 2rem 2rem 2rem',
    gap: '2rem',
  };

  const gameListStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '2rem',  // Adds space between cards
    flexWrap: 'wrap',  // Allows cards to wrap to next line if needed
    justifyContent: 'center',  // Centers the cards horizontally
  };

  const sudokuDescription = "Fill digits on a grid so that each row, \
  column and subgrid contains all the numbers without repetition."
  const ticTacToeDescription = "Mark Xs or Os on a grid. Try to get three \
  or five in a row horizontally, verically or diagonally."
  const minesweeperDescription = "Uncover all safe tiles without hitting a mine! \
  Use numbers as clues to find where the mines are hidden."

  return (
    <div>
      <Header
        showBack={false}
        onNavigate={(path) => navigate(path)}
      />
      <div style={contentStyle}>
        <h1 style={styles.mainTitleStyle}>
          Train logical thinking through accessible logical games
        </h1>
        <p style={styles.subtitleStyle}>
          Pick a game to start playing and stop being Ydea impaired.
        </p>
        <div style={gameListStyle}>
          <GameCard
            title="Sudoku"
            description={sudokuDescription}
            image="/sudoku_icon.png"
            onClick={() => navigate('/sudoku')}
          />
          <GameCard
            title="Tic-Tac-Toe"
            description={ticTacToeDescription}
            image="/tic_tac_toe_icon.png"
            onClick={() => navigate('/tic-tac-toe/settings')}
          />
          <GameCard
            title="Minesweeper"
            description={minesweeperDescription}
            image="/minesweeper_icon.png"
            onClick={() => navigate('/minesweeper')}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
