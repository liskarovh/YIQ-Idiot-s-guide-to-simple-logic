// minesweeper/views/MinesweeperGameView.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import colors from "../../Colors";
import MineGrid from "../components/MinesweeperGameComponents/MineGrid";

import { useMinesweeperGameController } from "../controllers/MinesweeperGameController.jsx";
import { GameInfoPanel } from "../components/MinesweeperGameComponents/GameInfoPanel.jsx";
import { GameplayControls } from "../components/MinesweeperGameComponents/GameplayControls.jsx";
import { ReviewControls } from "../components/MinesweeperGameComponents/ReviewControls.jsx";
import { GameOverControls } from "../components/MinesweeperGameComponents/GameOverControls.jsx";
import styles from "../styles/MinesweeperGameStyles.jsx";

function LoadingScreen() {
    const navigate = useNavigate();
    return (
            <div style={styles.page}>
                <Header showBack={true} onNavigate={() => navigate(-1)} />
                <div style={{ ...styles.shell, placeItems: "center" }}>
                    <div style={{ color: colors.text_header }}>Loading game…</div>
                </div>
            </div>
    );
}

export default function MinesweeperGameView() {
    const navigate = useNavigate();
    const ctrl = useMinesweeperGameController();

    if (!ctrl.view) return <LoadingScreen />;

    const left = (
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

    const board = (
            <div style={styles.boardWrap}>
                <div style={{ opacity: ctrl.paused ? 0.2 : 1, transition: "opacity 120ms" }}>
                    <MineGrid
                            rows={ctrl.view.rows}
                            cols={ctrl.view.cols}
                            opened={ctrl.view.board.opened}
                            flagged={ctrl.view.board.flagged}
                            permanentFlags={ctrl.permanentFlagsSet}
                            lostOn={ctrl.view.board?.lostOn}
                            hintRect={ctrl.hintRect}
                            highlightCell={ctrl.highlightCell}
                            quickFlag={ctrl.quickFlag}
                            isPaused={ctrl.isExploded}
                            beforeStart={ctrl.beforeStart}
                            onReveal={(r, c) => ctrl.canReveal && ctrl.doReveal(r, c)}
                            onFlag={(r, c, set) => ctrl.canFlag && ctrl.doFlag(r, c, set)}
                            onMoveFlag={(fr, fc, tr, tc) => ctrl.canFlag && ctrl.doMoveFlag(fr, fc, tr, tc)}
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

                {ctrl.error && (
                        <div style={{ color: "#ff6b6b", fontWeight: 700, textAlign: "center" }}>
                            ⚠️ {ctrl.error}
                        </div>
                )}
            </div>
    );

    return (
            <div style={styles.page}>
                <Header showBack={true} onNavigate={() => navigate(-1)} />
                <div style={styles.shell}>
                    {left}
                    {board}
                </div>
            </div>
    );
}

export { MinesweeperGameView };
