import Slider from "../../../components/Slider";
import NumberField from "../../../components/NumberField";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";

function SliderNumberControl({
                                 value,
                                 onChange,
                                 min,
                                 max,
                                 sliderWidth,
                                 maxDigits,
                                 zeroAsInfinity
                             }) {
    return (
            <div style={MinesweeperSettingsStyles.sliderAndNumberFieldStyle}>
                <Slider min={min}
                        max={max}
                        value={value}
                        onChange={onChange}
                        width={sliderWidth}
                />
                <NumberField
                        presetValue={value}
                        onChange={onChange}
                        minValue={min}
                        maxValue={max}
                        maxDigits={maxDigits}
                        zeroAsInfinity={zeroAsInfinity}
                />
            </div>
    );
}

export default SliderNumberControl;
