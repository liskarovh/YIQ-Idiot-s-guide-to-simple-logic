import React from "react";
import SettingRow from "../../../components/SettingsRow";
import ButtonSelect from "../../../components/ButtonSelect";
import MinesweeperSettingsStyles from "../../styles/MinesweeperSettingsStyles.jsx";

function DifficultyRow({preset, options, onChange}) {
    // Map options to ensure they have value, label, and disabled properties
    const mappedOptions = (options || []).map((option) => {
        // Both strings and objects are allowed
        if (option && typeof option === "object") {
            const value = option.value ?? option.name ?? option.label;
            return {
                ...option,
                value,
                label: option.label ?? option.name ?? String(value),
                disabled: Boolean(option.disabled) || String(value) === "Custom"
            };
        }

        const value = String(option);

        return {
            value,
            label: value,
            disabled: value === "Custom"
        };
    });

    return (
            <SettingRow
                    label="Difficulty:"
                    inline={MinesweeperSettingsStyles.settingsRowInline}
                    control={
                        <ButtonSelect
                                options={mappedOptions}
                                selected={preset}
                                onChange={onChange}
                        />
                    }
            />
    );
}

export default DifficultyRow;
