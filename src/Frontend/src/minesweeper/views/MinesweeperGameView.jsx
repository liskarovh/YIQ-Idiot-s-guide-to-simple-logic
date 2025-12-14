import {useCallback, useEffect, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {InformationCircleIcon, ArrowsPointingInIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon} from "@heroicons/react/24/outline";
import {useMinesweeperGameController} from "../controllers/MinesweeperGameController.jsx";
import MineGrid from "../components/MinesweeperGameComponents/MineGrid";
import GameInfoPanel from "../components/MinesweeperGameComponents/GameInfoPanel.jsx";
import ActionBar from "../components/MinesweeperGameComponents/ActionBar.jsx";
import LostOnControls from "../components/MinesweeperGameComponents/LostOnControls.jsx";
import GameOverControls from "../components/MinesweeperGameComponents/GameOverControls.jsx";
import GameLayout from "../components/MinesweeperGameComponents/GameLayout.jsx";
import MinesweeperGameStyles from "../styles/MinesweeperGameStyles.jsx";
import PanZoomViewport from "../components/MinesweeperGameComponents/PanZoomViewport.jsx";
import OverlayButton from "../components/MinesweeperGameComponents/OverlayButton";
import GameLoader from "../components/MinesweeperGameComponents/GameLoader";

function MinesweeperGameView() {
    const navigate = useNavigate();
    const ctrl = useMinesweeperGameController();

    // Reference to the viewport component
    const viewportRef = useRef(null);

    // Attach keyboard listener
    useEffect(() => {
        document.addEventListener("keydown", ctrl.handleKeyDown);
        return () => document.removeEventListener("keydown", ctrl.handleKeyDown);
    }, [ctrl.handleKeyDown]);

    // Callback for cursor initialization
    const handleCursorInit = useCallback((position) => {
        ctrl.setCursorPosition?.(position);
    }, [ctrl]);

    // Show settings loader if no game view is present
    if(!ctrl.view) {
        return (
                <GameLoader
                        onSettings={() => {
                            navigate("/minesweeper/settings");
                        }}
                        error={ctrl.error}
                />
        );
    }

    // Statistics panel
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

    // Mine grid
    const mineGrid = (
            <div style={{
                ...MinesweeperGameStyles.mineGrid,
                ...(ctrl.paused ? MinesweeperGameStyles.mineGridPaused : MinesweeperGameStyles.mineGridActive)
            }}
            >
                <MineGrid
                        /* Coordinates */
                        rows={ctrl.view.rows}
                        cols={ctrl.view.cols}

                        /* State */
                        opened={ctrl.view.board?.opened ?? []}
                        flagged={ctrl.view.board?.flagged ?? []}
                        permanentFlags={ctrl.permanentFlagsSet}
                        lostOn={ctrl.view.board?.lostOn}
                        mines={ctrl.view.board?.mines ?? []}

                        /* Highlighting */
                        holdHighlight={ctrl.holdHighlight}
                        hintRectangle={ctrl.hintRectangle}

                        /* Mutability */
                        highlightCell={ctrl.highlightCell}
                        quickFlag={ctrl.quickFlag}
                        isPaused={ctrl.paused || ctrl.isExploded}
                        beforeStart={ctrl.beforeStart}

                        /* Callbacks */
                        onReveal={(row, col) => ctrl.canReveal && ctrl.doReveal(row, col)}
                        onFlag={(row, col, set) => ctrl.canFlag && ctrl.doFlag(row, col, set)}
                        onBeginHold={ctrl.handleBeginHold}
                        onEndHold={ctrl.handleEndHold}

                        /* Keyboard mode */
                        focusedCell={ctrl.focusedCell}
                        keyboardDragging={ctrl.keyboardDragging}
                        cursorPosition={ctrl.cursorPosition}
                        onDropFlag={ctrl.onDropFlag}
                        onCursorInit={handleCursorInit}
                />
            </div>
    );

    // Action controls
    const actionArea = (!ctrl.isGameOver && !ctrl.isExploded) ? (
            <ActionBar
                    enableHints={ctrl.enableHints}
                    allowUndo={ctrl.allowUndo}
                    canUseActions={ctrl.canUseActions}
                    paused={ctrl.paused}
                    beforeStart={ctrl.beforeStart}
                    quickFlag={ctrl.quickFlag}
                    cursor={ctrl.view.cursor ?? 0}
                    onStrategy={() => navigate("/minesweeper/strategy")} // TODO: Implement strategy view and add controller function
                    onHint={ctrl.doHint}
                    hintDisabled={ctrl.hintCooldown}
                    onPauseToggle={() => ctrl.setPaused((p) => !p)}
                    onUndo={ctrl.doUndo}
                    onToggleQuickFlag={ctrl.doQuickFlagMode}
            />
    ) : ctrl.isExploded ? (
            <LostOnControls
                    busy={ctrl.busy}
                    max={ctrl.view.totalActions ?? 0}
                    value={ctrl.view.cursor ?? 0}
                    seekValue={ctrl.seekIndex}
                    onSeek={ctrl.handleSliderChange}
                    onUndoAndRevive={ctrl.doUndoAndRevive}
                    onReviveFromMove={ctrl.doReviveFromMove}
                    onPlayAgain={ctrl.onPlayAgain}
            />
    ) : (
                <GameOverControls
                        max={ctrl.view.totalActions ?? 0}
                        seekValue={ctrl.seekIndex}
                        onSeek={ctrl.handleSliderChange}
                        onPlayAgain={ctrl.onPlayAgain}
                        onExit={() => navigate("/", {replace: true})}
                />
        );

    // Board area with viewport and controls
    const boardArea = (
            <div
                    ref={ctrl.keyboardHostRef}
                    tabIndex={0}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: "1 1 auto",
                        minHeight: 0,
                        minWidth: 0,
                        outline: "none"
                    }}
            >
                <div style={{
                    ...MinesweeperGameStyles.viewportContent,
                    flex: "1 1 auto",
                    minHeight: 0
                }}
                >
                    {/* Viewport */}
                    <div style={{
                        flex: "1 1 auto",
                        minHeight: 0
                    }}
                    >
                        <PanZoomViewport
                                ref={viewportRef}
                                minScale={0.2}
                                maxScale={3}
                                initialScale={1}
                                autoFit="contain"
                        >
                            {mineGrid}
                        </PanZoomViewport>
                    </div>

                    {/* Help button - Top right */}
                    <OverlayButton
                            icon={
                                <InformationCircleIcon
                                        style={{width: 35, height: 35}}
                                        aria-hidden="true"
                                />}
                            title="Help"
                            ariaLabel="Show controls help"
                            onClick={() => {}}
                            hoverContent={
                                <div style={{
                                    padding: "12px 16px",
                                    backgroundColor: "rgba(0,0,0,0.9)",
                                    color: "#fff",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    lineHeight: "1.6",
                                    maxWidth: "280px",
                                    whiteSpace: "pre-line"
                                }}
                                >
                                    <strong>Mouse:</strong>{"\n"}
                                    <emph>Normal Mode:</emph>
                                    {"\n"}
                                    • Click: Reveal{"\n"}
                                    • Right-click: Flag{"\n"}
                                    • Hold: Highlight area{"\n"}
                                    <emph>Quick-Flag Mode:</emph>
                                    {"\n"}
                                    • Click: Toggle flag{"\n\n"}
                                    <strong>Keyboard:</strong>{"\n"}
                                    • <emph>Enable keyboard mode by pressing of the keys below.</emph>{"\n"}
                                    • Arrows: Navigate{"\n"}
                                    • Enter/Space: Reveal or Flag in Quick-Flag Mode{"\n"}
                                    • F: Toggle flag{"\n"}
                                    • T (hold): Highlight area{"\n"}
                                    • D: Drag-a-Flag mode (drop with D/Enter){"\n"}
                                    • Q: Quick flag mode{"\n"}
                                    • H: Hint{"\n"}
                                    • U: Undo{"\n"}
                                    • P: Pause{"\n"}
                                    • Esc: Exit keyboard mode{"\n\n"}
                                    <strong>Pan view:</strong>{"\n"}
                                    • Click + Drag: Move view{"\n"}
                                    • Ctrl + Mouse Wheel: Zoom in/out{"\n"}
                                    • Double Click: Fit to view
                                </div>
                            }
                            style={MinesweeperGameStyles.helpButton}
                            size={44}
                    />

                    {/* Zoom controls - Bottom right */}
                    <div style={MinesweeperGameStyles.zoomControls}>
                        <OverlayButton
                                icon={
                                    <MagnifyingGlassPlusIcon
                                            style={{width: 35, height: 35}}
                                            aria-hidden="true"
                                    />}
                                title="Zoom in"
                                onClick={() => viewportRef.current?.zoomIn()}
                                size={44}
                        />
                        <OverlayButton
                                icon={
                                    <MagnifyingGlassMinusIcon
                                            style={{width: 35, height: 35}}
                                            aria-hidden="true"
                                    />}
                                title="Zoom out"
                                onClick={() => viewportRef.current?.zoomOut()}
                                size={44}
                        />
                        <OverlayButton
                                icon={
                                    <ArrowsPointingInIcon
                                            style={{width: 35, height: 35}}
                                            aria-hidden="true"
                                    />}
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
                    statisticsArea={statisticsArea}
                    boardArea={boardArea}
                    actionsArea={actionArea}
                    error={ctrl.error}
            />
    );
}

export default MinesweeperGameView;
