import {useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import MineGrid from "../components/MinesweeperGameComponents/MineGrid";
import {useMinesweeperGameController} from "../controllers/MinesweeperGameController.jsx";
import {GameInfoPanel} from "../components/MinesweeperGameComponents/GameInfoPanel.jsx";
import {GameplayControls} from "../components/MinesweeperGameComponents/GameplayControls.jsx";
import {ReviewControls} from "../components/MinesweeperGameComponents/ReviewControls.jsx";
import {GameOverControls} from "../components/MinesweeperGameComponents/GameOverControls.jsx";
import GameLayout from "../components/MinesweeperGameComponents/GameLayout.jsx";
import SettingsLoader from "../components/MinesweeperSettingsComponents/SettingsLoader";
import MinesweeperGameStyles from "../styles/MinesweeperGameStyles.jsx";
import PanZoomViewport from "../components/MinesweeperGameComponents/PanZoomViewport.jsx";
import {useMediaQuery} from "../hooks/UseMediaQuery";
import OverlayButton from "../components/MinesweeperGameComponents/OverlayButton";

function MinesweeperGameView() {
    const navigate = useNavigate();
    const ctrl = useMinesweeperGameController();
    const viewportRef = useRef(null);

    const isNarrow = useMediaQuery("(max-width: 800px)");
    const [showStatsOverlay, setShowStatsOverlay] = useState(false);

    if(!ctrl.view) {
        return (
                <GameLayout
                        onSettings={() => {
                            navigate("/minesweeper/settings");
                        }}
                        leftPanel={
                            <SettingsLoader />}
                        boardArea={
                            <SettingsLoader />}
                        actionsArea={null}
                        error={ctrl.error}
                />
        );
    }

    const statisticsArea = (
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

    const mineGrid = (
            <div style={{...MinesweeperGameStyles.mineGrid, ...(ctrl.paused ? MinesweeperGameStyles.mineGridPaused : MinesweeperGameStyles.mineGridActive)}}>
                <MineGrid
                        rows={ctrl.view.rows}
                        cols={ctrl.view.cols}
                        opened={ctrl.view.board?.opened ?? []}
                        flagged={ctrl.view.board?.flagged ?? []}
                        permanentFlags={ctrl.permanentFlagsSet}
                        lostOn={ctrl.view.board?.lostOn}
                        hintRectangle={ctrl.hintRectangle}
                        highlightCell={ctrl.highlightCell}
                        quickFlag={ctrl.quickFlag}
                        isPaused={ctrl.paused || ctrl.isExploded}
                        beforeStart={ctrl.beforeStart}
                        onReveal={(row, col) => ctrl.canReveal && ctrl.doReveal(row, col)}
                        onFlag={(row, col, set) => ctrl.canFlag && ctrl.doFlag(row, col, set)}
                        onMoveFlag={(fromRow, fromCol, toRow, toCol) => ctrl.canFlag && ctrl.doMoveFlag(fromRow, fromCol, toRow, toCol)}
                        onBeginHold={ctrl.handleBeginHold}
                        onEndHold={ctrl.handleEndHold}
                        holdHighlight={ctrl.holdHighlight}
                        mines={ctrl.view.board?.mines ?? []}
                />
            </div>
    );

    // Determine which action controls to show
    const actionArea = (!ctrl.isGameOver && !ctrl.isExploded) ? (
            <GameplayControls
                    enableHints={ctrl.enableHints}
                    allowUndo={ctrl.allowUndo}
                    canUseActions={ctrl.canUseActions}
                    paused={ctrl.paused}
                    beforeStart={ctrl.beforeStart}
                    quickFlag={ctrl.quickFlag}
                    cursor={ctrl.view.cursor ?? 0}
                    onHint={ctrl.doHint}
                    hintDisabled={ctrl.hintCooldown}
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
        );

    const boardArea = (
            <div style={{...MinesweeperGameStyles.boardArea, ...(!isNarrow ? MinesweeperGameStyles.boardAreaRight : {})}}>
                {/* Stats panel - Shown above board when toggle is active */}
                {isNarrow && showStatsOverlay && (
                        <div style={MinesweeperGameStyles.statisticsAreaAbove}>
                            {statisticsArea}
                        </div>
                )}

                <div style={MinesweeperGameStyles.viewportContent}>
                    {/* Viewport */}
                    <PanZoomViewport
                            ref={viewportRef}
                            minScale={0.2}
                            maxScale={3}
                            initialScale={1}
                            autoFit="contain"
                    >
                        {mineGrid}
                    </PanZoomViewport>

                    {/* Statistics toggle button - Top right corner */}
                    {isNarrow && (
                            <OverlayButton
                                    icon={"ℹ️"}
                                    title={showStatsOverlay ? "Hide stats" : "Show stats"}
                                    ariaLabel={showStatsOverlay ? "Hide stats" : "Show stats"}
                                    onClick={() => setShowStatsOverlay(v => !v)}
                                    style={MinesweeperGameStyles.statisticsToggleButton}
                                    size={44}
                            />
                    )}

                    {/* Zoom controls - Bottom right corner */}
                    <div style={MinesweeperGameStyles.zoomControls}>
                        <OverlayButton
                                icon={"+"}
                                title="Zoom in"
                                onClick={() => viewportRef.current?.zoomIn()}
                                size={44}
                        />
                        <OverlayButton
                                icon={"−"}
                                title="Zoom out"
                                onClick={() => viewportRef.current?.zoomOut()}
                                size={44}
                        />
                        <OverlayButton
                                icon={"⊡"}
                                title="Fit to view"
                                onClick={() => viewportRef.current?.fitToContain()}
                                size={44}
                        />
                    </div>
                </div>
            </div>
    );

    // Render the game layout
    return (
            <GameLayout
                    onSettings={ctrl.onSettings}
                    statisticsArea={isNarrow ? null : statisticsArea}
                    boardArea={boardArea}
                    actionsArea={actionArea}
                    isNarrow={isNarrow}
                    error={ctrl.error}
            />
    );
}

export default MinesweeperGameView;
