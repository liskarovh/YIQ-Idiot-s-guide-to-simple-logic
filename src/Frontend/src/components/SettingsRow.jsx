/**
 * @file SettingsRow.jsx
 * @brief A React component that displays a setting row with a label, optional
 *        description, and a control element.
 *
 * @author David Krejčí \<xkrejcd00>
 */

import React from "react";
import colors from "../Colors";

/**
 * SETTING ROW COMPONENT - Displays a setting with label and control
 *
 * Props:
 * - label: string - Setting name/label
 * - description: string - Optional description text (optional)
 * - control: ReactNode - Control element (slider, toggle, select, etc.)
 */

function SettingRow({
                        label,
                        description,
                        control
                    }) {
    const containerStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        width: "100%"
    };

    const rowStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        width: "100%"
    };

    const labelStyle = {
        fontSize: "32px",
        fontWeight: "600",
        color: colors.text,
        margin: 0
    };

    const descriptionStyle = {
        fontSize: "16px",
        fontWeight: "400",
        color: colors.text,
        margin: 0,
        paddingLeft: "0.25rem",
        textAlign: "left"
    };

    return (
            <div style={containerStyle}>
                <div style={rowStyle}>
                    <span style={labelStyle}>{label}</span>
                    {control}
                </div>
                {description && (
                        <p style={descriptionStyle}>{description}</p>
                )}
            </div>
    );
}

export default SettingRow;
