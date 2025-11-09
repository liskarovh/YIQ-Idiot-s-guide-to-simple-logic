import GameBasicsPanel from "../components/MinesweeperSettingsComponents/GameBasicsPanel";
import GameplayPanel from "../components/MinesweeperSettingsComponents/GameplayPanel";
import SettingsLayout from "../components/MinesweeperSettingsComponents/SettingsLayout";
import {useMinesweeperSettingsController} from "../controllers/MinesweeperSettingsController.jsx";

function SettingsSkeleton() {
    return (
            <div style={{padding: 24, opacity: 0.6}}>
                Loading capabilities...
            </div>
    );
}

export default function MinesweeperSettingsView() {
    const ctrl = useMinesweeperSettingsController();

    if(!ctrl.loaded) {
        return (
                <SettingsLayout
                        onBack={() => window.history.back()}
                        leftPanel={
                            <SettingsSkeleton />
                        }
                        rightPanel={
                            <SettingsSkeleton />
                        }
                        onPlay={() => {}}
                        error={ctrl.error}
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
                    onPresetChange={ctrl.changePreset}
                    onRowsChange={ctrl.safeSetRows}
                    onColsChange={ctrl.safeSetCols}
                    onMinesChange={ctrl.safeSetMines}
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
                    onBack={() => window.history.back()}
                    leftPanel={leftPanel}
                    rightPanel={rightPanel}
                    onPlay={ctrl.handlePlay}
                    error={ctrl.error}
                    disabled={ctrl.submitting}
            />
    );
}
