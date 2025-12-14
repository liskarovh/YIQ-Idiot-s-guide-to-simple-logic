/**
 * @file MinesweeperSettingsRow.jsx
 * @brief A single row in the Minesweeper settings panel.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React from "react";
import colors from "../../../Colors";

/**
 * @brief A single row in the Minesweeper settings panel, consisting of a label,
 *        an optional description, and a control element.
 *
 * @param label A string representing the label of the setting.
 * @param description An optional string providing additional information about the setting.
 * @param control A React element representing the control for the setting (e.g., a slider, checkbox).
 */
function MinesweeperSettingsRow({
                                    label,
                                    description,
                                    control
                                }) {
    const containerStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "clamp(6px, 0.8vw, 8px)",
        width: "100%"
    };

    const rowStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        gap: "clamp(16px, 2vw, 20px)"
    };

    const labelStyle = {
        fontSize: "clamp(20px, 2.8vw, 28px)",
        fontWeight: "600",
        color: colors.text,
        margin: 0,
        lineHeight: 1.3,
        flexShrink: 0,
        textAlign: "left"
    };

    const descriptionStyle = {
        fontSize: "clamp(14px, 1.8vw, 16px)",
        fontWeight: "400",
        color: colors.text,
        margin: 0,
        paddingLeft: "clamp(4px, 0.5vw, 6px)",
        textAlign: "left",
        lineHeight: 1.4
    };

    const controlWrapper = {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        minWidth: 0,
        flex: 1
    };

    return (
            <div style={containerStyle}>
                <div style={rowStyle}>
                    <span style={labelStyle}>{label}</span>
                    <div style={controlWrapper}>
                        {control}
                    </div>
                </div>
                {description && (
                        <p style={descriptionStyle}>{description}</p>
                )}
            </div>
    );
}

export default MinesweeperSettingsRow;
