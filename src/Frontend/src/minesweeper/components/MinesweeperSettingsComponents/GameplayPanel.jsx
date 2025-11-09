import Box from "../../../components/Box";
import SettingRow from "../../../components/SettingsRow";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";
import SliderNumberControl from "./SliderWithNumberControl";
import ToggleRow from "./ToggleRow";

function GameplayPanel({
                           lives,
                           showTimer,
                           allowUndo,
                           enableHints,
                           limits,
                           onLivesChange,
                           onShowTimerChange,
                           onAllowUndoChange,
                           onEnableHintsChange
                       }) {
    const livesL = (limits && limits.lives) || {min: 0, max: 10};

    return (
            <Box width={MinesweeperSettingsStyles.boxWidth}
                 height={MinesweeperSettingsStyles.boxHeight}
                 style={MinesweeperSettingsStyles.boxStyle}
                 title="Gameplay"
            >
                <SettingRow
                        label="Number of Lives:"
                        inline={MinesweeperSettingsStyles.settingsRowInline}
                        control={
                            <SliderNumberControl
                                    value={lives}
                                    onChange={onLivesChange}
                                    min={livesL.min}
                                    max={livesL.max}
                                    sliderWidth={MinesweeperSettingsStyles.sliderGameplayPanelWidth}
                                    maxDigits={MinesweeperSettingsStyles.numberFieldMaxDigits}
                                    zeroAsInfinity={true}
                            />}
                />

                <ToggleRow
                        label="Enable Timer:"
                        checked={showTimer}
                        onChange={onShowTimerChange}
                />

                <ToggleRow
                        label="Enable Undo(s):"
                        checked={allowUndo}
                        onChange={onAllowUndoChange}
                />

                <ToggleRow
                        label="Enable Hints:"
                        checked={enableHints}
                        onChange={onEnableHintsChange}
                />
            </Box>
    );
}

export default GameplayPanel;
