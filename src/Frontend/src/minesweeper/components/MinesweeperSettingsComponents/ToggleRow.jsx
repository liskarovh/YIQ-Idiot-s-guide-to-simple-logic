/**
 * @file ToggleRow.jsx
 * @brief A React component for a settings row with a toggle switch in Minesweeper.
 *
 * @author Jan Kalina \<xkalinj00>
 */

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
