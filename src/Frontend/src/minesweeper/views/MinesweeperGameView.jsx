import React from "react";
import {useNavigate} from "react-router-dom";
import MineGrid from "../components/MinesweeperGameComponents/MineGrid";
import {useMinesweeperGameController} from "../controllers/MinesweeperGameController.jsx";
import {GameInfoPanel} from "../components/MinesweeperGameComponents/GameInfoPanel.jsx";
import {GameplayControls} from "../components/MinesweeperGameComponents/GameplayControls.jsx";
import {ReviewControls} from "../components/MinesweeperGameComponents/ReviewControls.jsx";
import {GameOverControls} from "../components/MinesweeperGameComponents/GameOverControls.jsx";
import GameLayout from "../components/MinesweeperGameComponents/GameLayout.jsx";
import SettingsLoader from "../components/MinesweeperSettingsComponents/SettingsLoader";
import styles from "../styles/MinesweeperGameStyles.jsx";

function MinesweeperGameView() {
    const navigate = useNavigate();
    const ctrl = useMinesweeperGameController();

    // Loading state mirrors SettingsView: show two loader panels in the same layout
    if(!ctrl.view) {
        return (
                <GameLayout
                        onBack={() => navigate(-1)}
                        leftPanel={<SettingsLoader />}
                        rightPanel={<SettingsLoader />}
                        error={ctrl.error}
                />
        );
    }

    const leftPanel = (
            <GameInfoPanel
                    view={ctrl.view}
                    difficulty={ctrl.difficulty}
                    minesRemaining={ctrl.minesRemaining}
                    hearts={ctrl.hearts}
                    showTimer={ctrl.showTimer}
                    timerSec={ctrl.timerSec}
                    isGameOver={ctrl.isGameOver}
                    hintsUsed={ctrl.hintsUsed}
            />
    );

    const rightPanel = (
            <div style={styles.boardWrap}>
                <div style={{opacity: ctrl.paused ? 0.2 : 1, transition: "opacity 120ms"}}>
                    <MineGrid
                            rows={ctrl.view.rows}
                            cols={ctrl.view.cols}
                            opened={ctrl.view.board.opened}
                            flagged={ctrl.view.board.flagged}
                            permanentFlags={ctrl.permanentFlagsSet}
                            lostOn={ctrl.view.board?.lostOn}
                            hintRectangle={ctrl.hintRectangle}
                            highlightCell={ctrl.highlightCell}
                            quickFlag={ctrl.quickFlag}
                            isPaused={ctrl.isExploded}
                            beforeStart={ctrl.beforeStart}
                            onReveal={(row, col) => ctrl.canReveal && ctrl.doReveal(row, col)}
                            onFlag={(row, col, set) => ctrl.canFlag && ctrl.doFlag(row, col, set)}
                            onMoveFlag={(fromRow, fromCol, toRow, toCol) => ctrl.canFlag && ctrl.doMoveFlag(fromRow, fromCol, toRow, toCol)}
                            onBeginHold={ctrl.handleBeginHold}
                            onEndHold={ctrl.handleEndHold}
                            holdHighlight={ctrl.holdHighlight}
                            mines={ctrl.view.board.mines}
                    />
                </div>

                {!ctrl.isGameOver && !ctrl.isExploded ? (
                        <GameplayControls
                                enableHints={ctrl.enableHints}
                                allowUndo={ctrl.allowUndo}
                                canUseActions={ctrl.canUseActions}
                                paused={ctrl.paused}
                                beforeStart={ctrl.beforeStart}
                                quickFlag={ctrl.quickFlag}
                                cursor={ctrl.view.cursor ?? 0}
                                onHint={ctrl.doHint}
                                onPauseToggle={() => ctrl.setPaused((p) => !p)}
                                onUndo={ctrl.doUndo}
                                onToggleQuickFlag={ctrl.toggleQuickFlag}
                        />
                ) : ctrl.isExploded ? (
                        <ReviewControls
                                busy={ctrl.busy}
                                max={ctrl.view.totalActions ?? 0}
                                value={ctrl.view.cursor ?? 0}
                                seekValue={ctrl.seekIndex}
                                onSeek={ctrl.handleSliderChange}
                                onUndoAndRevive={ctrl.doUndoAndRevive}
                                onReviveFromMove={ctrl.doReviveFromMove}
                                onPlayAgain={() => navigate("/minesweeper")}
                        />
                ) : (
                            <GameOverControls
                                    max={ctrl.view.totalActions ?? 0}
                                    seekValue={ctrl.seekIndex}
                                    onSeek={ctrl.handleSliderChange}
                                    onPlayAgain={() => navigate("/minesweeper")}
                                    onExit={() => navigate("/")}
                            />
                    )}
            </div>
    );

    return (
            <GameLayout
                    onBack={() => navigate(-1)}
                    leftPanel={leftPanel}
                    rightPanel={rightPanel}
                    error={ctrl.error}
            />
    );
}

export default MinesweeperGameView;
