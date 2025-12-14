import React from "react";
import MinesweeperSlider from "../MinesweeperCommonComponents/MinesweeperSlider";
import MinesweeperNumberField from "../MinesweeperCommonComponents/MinesweeperNumberField";

function SliderWithNumberControl({
                                     value,
                                     onChange,
                                     min,
                                     max,
                                     maxDigits,
                                     zeroAsInfinity,
                                     sliderWidth
                                 }) {
    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(22px, 2.6vw, 32px)',
        width: '100%',
        justifyContent: 'flex-end'
    };

    return (
            <div style={containerStyle}>
                <MinesweeperSlider
                        min={min}
                        max={max}
                        value={value}
                        onChange={onChange}
                        width={sliderWidth}
                />
                <MinesweeperNumberField
                        value={value}
                        onChange={onChange}
                        minValue={min}
                        maxValue={max}
                        maxDigits={maxDigits}
                        zeroAsInfinity={zeroAsInfinity}
                />
            </div>
    );
}

export default SliderWithNumberControl;
