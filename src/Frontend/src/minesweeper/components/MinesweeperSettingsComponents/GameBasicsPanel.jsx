import React, {useLayoutEffect, useRef, useState} from "react";
import Box from "../../../components/Box";
import MinesweeperSettingsRow from "../MinesweeperCommonComponents/MinesweeperSettingsRow";
import SliderWithNumberControl from "./SliderWithNumberControl";
import DifficultyRow from "./DifficultyRow";
import colors from "../../../Colors";
import MinesweeperInfoPanel from "../MinesweeperCommonComponents/MinesweeperInfoPanel";

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
                             onMinesChange,
                             maxHeightPx
                         }) {
    const rowsL = limits?.rows || {min: 3, max: 30};
    const colsL = limits?.cols || {min: 3, max: 30};
    const minesL = {min: 1, max: maxMines} || limits?.mines || {min: 1, max: 900};

    return (
            <MinesweeperInfoPanel
                    title="Game Basics"
                    maxHeightPx={maxHeightPx}
                    gap="clamp(20px, 2.8vw, 28px)"
                    paddingBottom="clamp(40px, 5.6vw, 56px)"
            >

                    <DifficultyRow
                            preset={preset}
                            options={difficultyOptions}
                            onChange={onPresetChange}
                    />

                    <MinesweeperSettingsRow
                            label="Rows:"
                            inline={true}
                            control={
                                <SliderWithNumberControl
                                        value={rows}
                                        onChange={onRowsChange}
                                        min={rowsL.min}
                                        max={rowsL.max}
                                        maxDigits={3}
                                />}
                    />

                    <MinesweeperSettingsRow
                            label="Columns:"
                            inline={true}
                            control={
                                <SliderWithNumberControl
                                        value={cols}
                                        onChange={onColsChange}
                                        min={colsL.min}
                                        max={colsL.max}
                                        maxDigits={3}
                                />}
                    />

                    <MinesweeperSettingsRow
                            label="Mines:"
                            inline={true}
                            control={
                                <SliderWithNumberControl
                                        value={mines}
                                        onChange={onMinesChange}
                                        min={minesL.min}
                                        max={minesL.max}
                                        maxDigits={3}
                                />}
                    />
            </MinesweeperInfoPanel>
    );
}

export default GameBasicsPanel;
