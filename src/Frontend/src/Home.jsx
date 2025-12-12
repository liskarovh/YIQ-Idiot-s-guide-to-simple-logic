import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Styles';
import Header from './components/Header'
import GameCard from './components/GameCard';
import SudokuIcon from './assets/home/SudokuIcon.svg';
import TicTacToeIcon from './assets/home/TicTacToeIcon.svg';
import MinesweeperIcon from './assets/home/MinesweeperIcon.svg';
import AutoScale from './components/AutoScale';

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
                    <AutoScale
                            baseWidth={1490}
                            baseHeight={280}
                            minScale={0.4}
                            maxScale={1}
                            center={true}
                    >
                        <div style={{ width: '100%' }}>
                            <h1 style={styles.mainTitleStyle}>
                                Train logical thinking through accessible logical games
                            </h1>
                            <p style={styles.subtitleStyle}>
                                Pick a game to start playing and stop being Ydea impaired.
                            </p>
                        </div>
                    </AutoScale>
                    <div style={gameListStyle}>
                        <GameCard
                                title="Sudoku"
                                description={sudokuDescription}
                                image={SudokuIcon}
                                onCardClick={() => navigate('/sudoku')}
                                onPlayNowClick={() => navigate('/sudoku')}
                                onSettingsClick={() => navigate('/')}
                                onStrategyClick={() => navigate('/')}
                        />
                        <GameCard
                                title="Tic-Tac-Toe"
                                description={ticTacToeDescription}
                                image={TicTacToeIcon}
                                onCardClick={() => navigate('/tic-tac-toe?fresh=1')}
                                onPlayNowClick={() => navigate('/tic-tac-toe?fresh=1')}
                                onSettingsClick={() => navigate('/tic-tac-toe/settings')}
                                onStrategyClick={() => navigate('/tic-tac-toe/strategy')}
                        />
                        <GameCard
                                title="Minesweeper"
                                description={minesweeperDescription}
                                image={MinesweeperIcon}
                                onCardClick={() => navigate('/minesweeper')}
                                onPlayNowClick={() => navigate('/minesweeper')}
                                onSettingsClick={() => navigate('')}
                                onStrategyClick={() => navigate('')}
                        />
                    </div>
                </div>
            </div>
    );
}

export default Home;
