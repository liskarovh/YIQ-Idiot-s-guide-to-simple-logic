import React from "react";
import MinesweeperInfoPanel from "../MinesweeperCommonComponents/MinesweeperInfoPanel";
import MinesweeperSettingsRow from "../MinesweeperCommonComponents/MinesweeperSettingsRow";
import SliderWithNumberControl from "./SliderWithNumberControl";
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
                           onEnableHintsChange,
                           maxHeightPx
                       }) {
    const livesL = (limits && limits.lives) || {min: 0, max: 10};

    return (
            <MinesweeperInfoPanel
                    title="Gameplay Preferences"
                    maxHeightPx={maxHeightPx}
                    gap="clamp(20px, 2.8vw, 28px)"
                    paddingBottom="clamp(40px, 5.6vw, 56px)"
            >
                <MinesweeperSettingsRow
                        label="Number of lives:"
                        inline={true}
                        control={
                            <SliderWithNumberControl
                                    value={lives}
                                    onChange={onLivesChange}
                                    min={livesL.min}
                                    max={livesL.max}
                                    maxDigits={3}
                                    zeroAsInfinity={true}
                                    sliderWidth="clamp(140px, 18vw, 240px)"
                            />}
                />

                <ToggleRow
                        label="Enable timer:"
                        checked={showTimer}
                        onChange={onShowTimerChange}
                />

                <ToggleRow
                        label="Enable undo(s):"
                        checked={allowUndo}
                        onChange={onAllowUndoChange}
                />

                <ToggleRow
                        label="Enable hints:"
                        checked={enableHints}
                        onChange={onEnableHintsChange}
                />
            </MinesweeperInfoPanel>
    );
}

export default GameplayPanel;
