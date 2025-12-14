/**
 * @file Minesweeper settings view
 * @brief A React component for the Minesweeper settings view.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import GameBasicsPanel from "../components/MinesweeperSettingsComponents/GameBasicsPanel";
import GameplayPanel from "../components/MinesweeperSettingsComponents/GameplayPanel";
import SettingsLayout from "../components/MinesweeperSettingsComponents/SettingsLayout";
import SettingsLoader from "../components/MinesweeperSettingsComponents/SettingsLoader";
import {MinesweeperSettingsController} from "../controllers/MinesweeperSettingsController";

export default function MinesweeperSettingsView() {
    const ctrl = MinesweeperSettingsController();

    if(ctrl.capsLoading) {
        return (
                <SettingsLayout
                        onBack={ctrl.onBack}
                        leftPanel={
                            <SettingsLoader />}
                        rightPanel={
                            <SettingsLoader />}
                        onPlay={() => {}}
                        error={ctrl.submitError}
                        disabled={true}
                />
        );
    }

    const leftPanel = (
            <GameBasicsPanel
                    preset={ctrl.preset}
                    difficultyOptions={ctrl.difficultyOptions}
                    rows={ctrl.rows}
                    cols={ctrl.cols}
                    mines={ctrl.mines}
                    maxMines={ctrl.maxMines}
                    limits={ctrl.limits}
                    onPresetChange={ctrl.handleChangePreset}
                    onRowsChange={ctrl.handleSetRows}
                    onColsChange={ctrl.handleSetCols}
                    onMinesChange={ctrl.handleSetMines}
            />
    );

    const rightPanel = (
            <GameplayPanel
                    lives={ctrl.lives}
                    showTimer={ctrl.showTimer}
                    allowUndo={ctrl.allowUndo}
                    enableHints={ctrl.enableHints}
                    limits={ctrl.limits}
                    onLivesChange={ctrl.handleLivesChange}
                    onShowTimerChange={ctrl.handleShowTimerChange}
                    onAllowUndoChange={ctrl.handleAllowUndoChange}
                    onEnableHintsChange={ctrl.handleEnableHintsChange}
            />
    );

    return (
            <SettingsLayout
                    onBack={ctrl.onBack}
                    leftPanel={leftPanel}
                    rightPanel={rightPanel}
                    onPlay={ctrl.onPlay}
                    onResetOriginalSettings={ctrl.onResetOriginalSettings}
                    disabled={ctrl.submitting}
                    fromGame={ctrl.fromGame}
                    changesDetected={ctrl.changesDetected}
                    error={ctrl.submitError}
            />
    );
}
