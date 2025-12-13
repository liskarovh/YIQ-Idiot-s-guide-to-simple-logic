import React from "react";
import colors from "../../../Colors";

export default function ActionButton({icon, label, disabled, onClick, active, style}) {
    const actionButtonStyle = {
        display: "grid",
        placeItems: "center",
        gap: 6,
        width: 90,
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "default" : "pointer",
        color: colors.text_header,
        userSelect: "none",
        filter: active ? "drop-shadow(0 0 8px rgba(255,255,255,0.25))" : "none",
        ...style
    };
    const titleStyle = {
        fontSize: 13,
        textAlign: "center"
    };

    return (
            <div style={actionButtonStyle}
                 onClick={() => !disabled && onClick?.()}
            >
                <div>{icon}</div>
                <div style={titleStyle}>{label}</div>
            </div>
    );
}
