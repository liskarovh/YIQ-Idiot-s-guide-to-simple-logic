import SettingRow from "../../../components/SettingsRow";
import ToggleSwitch from "../../../components/ToggleButton";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";

function ToggleRow({label, checked, onChange}) {
    return (
            <SettingRow
                    label={label}
                    inline={MinesweeperSettingsStyles.settingsRowInline}
                    control={
                        <div style={MinesweeperSettingsStyles.sliderAndNumberFieldStyle}>
                            <ToggleSwitch
                                    checked={checked}
                                    onChange={onChange}
                            />
                        </div>}
            />
    );
}

export default ToggleRow;
