import React, {useRef, useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import styles from "./Styles";
import Header from "./components/Header";
import GameCard from "./components/GameCard";
import SudokuIcon from "./assets/home/SudokuIcon.svg";
import TicTacToeIcon from "./assets/home/TicTacToeIcon.svg";
import MinesweeperIcon from "./assets/home/MinesweeperIcon.svg";
import AutoScale from "./components/AutoScale";
import {useMediaQuery} from "./minesweeper/hooks/UseMediaQuery";

function Home() {
    const navigate = useNavigate();

    // Ref and state for content scaling
    const gameListRef = useRef(null);
    const [isStacked, setIsStacked] = useState(false);
    const isNarrow = useMediaQuery("(max-width: 450)");
    const isMedium = useMediaQuery("(max-width: 900px)");

    // Effect to check if game cards are stacked
    useEffect(() => {
        const element = gameListRef.current;
        if(!element) {
            return;
        }

        const checkStacked = () => {
            const children = Array.from(element.children).filter(child => child instanceof Element);
            if(children.length < 2) {
                setIsStacked(false);
                return;
            }

            // Normalize top positions with a small tolerance and check uniqueness.
            // If every child has a distinct normalized top, then all cards are stacked vertically.
            const tops = children.map(c => c.getBoundingClientRect().top);
            const normalized = tops.map(t => Math.round(t / 4)); // 4px tolerance
            const uniqueNormals = new Set(normalized);
            const isStacked = uniqueNormals.size === children.length;

            setIsStacked(isStacked);
        };

        checkStacked();

        let resizeObserver;
        if(typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(checkStacked);
            resizeObserver.observe(element);
        }

        window.addEventListener("resize", checkStacked);
        window.addEventListener("orientationchange", checkStacked);

        return () => {
            if(resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener("resize", checkStacked);
            window.removeEventListener("orientationchange", checkStacked);
        };
    }, []);

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
        gap: "2rem",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: "100%"
    };

    const sudokuDescription = "Fill digits on a grid so that each row, column and subgrid contains all the numbers without repetition.";
    const ticTacToeDescription = "Mark Xs or Os on a grid. Try to get three or five in a row horizontally, verically or diagonally.";
    const minesweeperDescription = "Uncover all safe tiles without hitting a mine! Use numbers as clues to find where the mines are hidden.";

    const autoScaleOptions = {
        baseWidth: 1150,
        baseHeight: 280,
        maxScale: 1,
        minScale: 0.6,
        center: true
    };

    return (
            <div>
                <Header
                        showBack={false}
                        onNavigate={(path) => navigate(path)}
                />
                <div style={contentStyle}>
                    {isNarrow ?
                     <div>
                         <h1 style={{...styles.mainTitleStyleWide, ...styles.mainTitleStyleNarrow}}>
                             Train logical thinking through accessible logical games
                         </h1>
                         <p style={{...styles.subtitleStyleWide, ...styles.subtitleStyleNarrow}}>
                             Pick a game to start playing and stop being Ydea impaired.
                         </p>
                     </div>
                              : isMedium ?
                                <div>
                                    <h1 style={{...styles.mainTitleStyleWide, ...styles.mainTitleStyleMedium}}>
                                        Train logical thinking through accessible logical games
                                    </h1>
                                    <p style={{...styles.subtitleStyleWide, ...styles.subtitleStyleMedium}}>
                                        Pick a game to start playing and stop being Ydea impaired.
                                    </p>
                                </div> :
                                <AutoScale {...autoScaleOptions}>
                                    <div>
                                        <h1 style={styles.mainTitleStyleWide}>
                                            Train logical thinking through accessible logical games
                                        </h1>
                                        <p style={styles.subtitleStyleWide}>
                                            Pick a game to start playing and stop being Ydea impaired.
                                        </p>
                                    </div>
                                </AutoScale>
                    }
                    <div style={gameListStyle}
                         ref={gameListRef}
                    >
                        <GameCard
                                title="Sudoku"
                                description={sudokuDescription}
                                image={SudokuIcon}
                                onCardClick={() => navigate("/sudoku")}
                                onPlayNowClick={() => navigate("/sudoku")}
                                onSettingsClick={() => navigate("/")}
                                onStrategyClick={() => navigate("/")}
                                isStacked={isStacked}
                        />
                        <GameCard
                                title="Tic-Tac-Toe"
                                description={ticTacToeDescription}
                                image={TicTacToeIcon}
                                onCardClick={() => navigate("/tic-tac-toe/settings")}
                                onPlayNowClick={() => navigate("/tic-tac-toe/settings")}
                                onSettingsClick={() => navigate("/")}
                                onStrategyClick={() => navigate("/")}
                                isStacked={isStacked}
                        />
                        <GameCard
                                title="Minesweeper"
                                description={minesweeperDescription}
                                image={MinesweeperIcon}
                                onCardClick={() => navigate("/minesweeper")}
                                onPlayNowClick={() => navigate("/minesweeper")}
                                onSettingsClick={() => navigate("/minesweeper/settings")}
                                onStrategyClick={() => navigate("/minesweeper/strategy")}
                                isStacked={isStacked}
                        />
                    </div>
                </div>
            </div>
    );
}

export default Home;
