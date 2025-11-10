import Box from "../../../components/Box";
import SettingRow from "../../../components/SettingsRow";
import SliderWithNumberControl from "./SliderWithNumberControl";
import DifficultyRow from "./DifficultyRow";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";

function GameBasicsPanel({
                             preset,
                             difficultyOptions,
                             rows,
                             cols,
                             mines,
                             maxMines,
                             limits,
                             onPresetChange,
                             onRowsChange,
                             onColsChange,
                             onMinesChange
                         }) {
    const rowsL = limits?.rows || {min: 3, max: 30};
    const colsL = limits?.cols || {min: 3, max: 30};
    const minesL = {min: 1, max: maxMines} || limits?.mines || {min: 1, max: 900};

    return (
            <Box width={MinesweeperSettingsStyles.boxWidth}
                 height={MinesweeperSettingsStyles.boxHeight}
                 style={MinesweeperSettingsStyles.boxStyle}
                 title="Game Basics"
            >
                <DifficultyRow
                        preset={preset}
                        options={difficultyOptions}
                        onChange={onPresetChange}
                />

                <SettingRow
                        label="Rows:"
                        inline={MinesweeperSettingsStyles.settingsRowInline}
                        control={
                            <SliderWithNumberControl
                                    value={rows}
                                    onChange={onRowsChange}
                                    min={rowsL.min}
                                    max={rowsL.max}
                                    sliderWidth={MinesweeperSettingsStyles.sliderGameBasicsPanelWidth}
                                    maxDigits={MinesweeperSettingsStyles.numberFieldMaxDigits}
                            />}
                />

                <SettingRow
                        label="Columns:"
                        inline={MinesweeperSettingsStyles.settingsRowInline}
                        control={
                            <SliderWithNumberControl
                                    value={cols}
                                    onChange={onColsChange}
                                    min={colsL.min}
                                    max={colsL.max}
                                    sliderWidth={MinesweeperSettingsStyles.sliderGameBasicsPanelWidth}
                                    maxDigits={MinesweeperSettingsStyles.numberFieldMaxDigits}
                            />}
                />

                <SettingRow
                        label="Mines:"
                        inline={MinesweeperSettingsStyles.settingsRowInline}
                        control={
                            <SliderWithNumberControl
                                    value={mines}
                                    onChange={onMinesChange}
                                    min={minesL.min}
                                    max={minesL.max}
                                    sliderWidth={MinesweeperSettingsStyles.sliderGameBasicsPanelWidth}
                                    maxDigits={MinesweeperSettingsStyles.numberFieldMaxDigits}
                            />}
                />
            </Box>
    );
}

export default GameBasicsPanel;
