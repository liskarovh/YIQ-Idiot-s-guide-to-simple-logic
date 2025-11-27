import {useNavigate} from "react-router-dom";
import GameBasicsPanel from "../components/MinesweeperSettingsComponents/GameBasicsPanel";
import GameplayPanel from "../components/MinesweeperSettingsComponents/GameplayPanel";
import SettingsLayout from "../components/MinesweeperSettingsComponents/SettingsLayout";
import SettingsLoader from "../components/MinesweeperSettingsComponents/SettingsLoader";
import {useMinesweeperSettingsController} from "../controllers/MinesweeperSettingsController";

export default function MinesweeperSettingsView() {
    const ctrl = useMinesweeperSettingsController();
    const navigate = useNavigate();

    if(ctrl.loaded) {
        return (
                <SettingsLayout
                        onBack={() => navigate(-1)}
                        leftPanel={
                            <SettingsLoader />
                        }
                        rightPanel={
                            <SettingsLoader />
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
