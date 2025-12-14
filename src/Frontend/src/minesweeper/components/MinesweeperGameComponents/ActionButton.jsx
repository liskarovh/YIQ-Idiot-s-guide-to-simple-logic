import React from "react";
import colors from "../../../Colors";

export default function ActionButton({icon, label, disabled, onClick, active, style, draggable = false, onDragStart, onDragEnd}) {
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
        fontSize: 16,
        textAlign: "center"
    };

    return (
            <div style={actionButtonStyle}
                 onClick={() => !disabled && onClick?.()}
                 draggable={draggable && !disabled}
                 onDragStart={(event) => {
                     if(disabled) {
                         event.preventDefault();
                         return;
                     }
                     onDragStart?.(event);
                 }}
                 onDragEnd={(event) => onDragEnd?.(event)}
            >
                <div>{icon}</div>
                <div style={titleStyle}>{label}</div>
            </div>
    );
}
