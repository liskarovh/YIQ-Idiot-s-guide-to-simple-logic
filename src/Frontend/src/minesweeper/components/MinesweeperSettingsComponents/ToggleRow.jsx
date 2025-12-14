import React from "react";
import MinesweeperSettingsRow from "../MinesweeperCommonComponents/MinesweeperSettingsRow";
import ToggleSwitch from "../MinesweeperCommonComponents/MinesweeperToggleButton";

function ToggleRow({label, checked, onChange}) {
    return (
            <MinesweeperSettingsRow
                    label={label}
                    inline={true}
                    control={
                        <ToggleSwitch
                                checked={checked}
                                onChange={onChange}
                        />
                    }
            />
    );
}

export default ToggleRow;
