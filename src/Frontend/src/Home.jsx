import {useNavigate} from "react-router-dom";
import styles from "./Styles";
import Header from "./components/Header";
import GameCard from "./components/GameCard";
import SudokuIcon from "./assets/home/SudokuIcon.svg";
import TicTacToeIcon from "./assets/home/TicTacToeIcon.svg";
import MinesweeperIcon from "./assets/home/MinesweeperIcon.svg";

function Home() {
    const navigate = useNavigate();

    // Styles
    const contentStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "5rem 2rem 2rem 2rem",
        gap: "2rem"
    };

    const gameListStyle = {
        display: "flex",
        flexDirection: "row",
        gap: "3rem",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: "100%",
        margin: 0
    };

    const sudokuDescription = "Fill digits on a grid so that each row, column and subgrid contains all the numbers without repetition.";
    const ticTacToeDescription = "Mark Xs or Os on a grid. Try to get three or five in a row horizontally, verically or diagonally.";
    const minesweeperDescription = "Uncover all safe tiles without hitting a mine! Use numbers as clues to find where the mines are hidden.";

    return (
            <div>
                <Header
                        showBack={false}
                        onNavigate={(path) => navigate(path)}
                />
                <div style={contentStyle}>
                    <div>
                        <h1 style={{...styles.mainTitleStyle, maxWidth: '1400px'}}>
                            Train logical thinking through accessible logical games
                        </h1>
                        <p style={{...styles.subtitleStyle, marginBottom: '1rem'}}>
                            Pick a game to start playing and stop being Ydea impaired.
                        </p>
                    </div>
                    <div style={gameListStyle}>
                        <GameCard
                                title="Sudoku"
                                description={sudokuDescription}
                                image={SudokuIcon}
                                onCardClick={() => navigate("/sudoku")}
                                onPlayNowClick={() => navigate("/sudoku")}
                                onSettingsClick={() => {navigate("/sudoku", { state: { view: "Selection" }})}}
                                onStrategyClick={() => navigate("/sudoku", { state: { view: "Strategy" }})}
                        />
                        <GameCard
                                title="Tic-Tac-Toe"
                                description={ticTacToeDescription}
                                image={TicTacToeIcon}
                                onCardClick={() => navigate("/tic-tac-toe?fresh=1")}
                                onPlayNowClick={() => navigate("/tic-tac-toe?fresh=1")}
                                onSettingsClick={() => navigate("/tic-tac-toe/settings")}
                                onStrategyClick={() => navigate("/tic-tac-toe/strategy", {state: {from: "/"}})}
                        />
                        <GameCard
                                title="Minesweeper"
                                description={minesweeperDescription}
                                image={MinesweeperIcon}
                                onCardClick={() => navigate("/minesweeper")}
                                onPlayNowClick={() => navigate("/minesweeper")}
                                onSettingsClick={() => navigate("/minesweeper/settings")}
                                onStrategyClick={() => navigate("/minesweeper/strategy")}
                        />
                    </div>
                </div>
            </div>
    );
}

export default Home;
