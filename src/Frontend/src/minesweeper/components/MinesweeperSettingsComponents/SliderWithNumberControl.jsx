import Slider from "../../../components/Slider";
import NumberField from "../../../components/NumberField";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";

function SliderWithNumberControl({
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
