// minesweeper/components/MinesweeperGameComponents/ActionPill.jsx
import React from "react";
import colors from "../../../Colors";

export default function ActionPill({ children, onClick, disabled }) {
    const style = {
        padding: "10px 18px",
        borderRadius: 14,
        background: "rgba(148,163,184,0.18)",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
        color: colors.text,
        fontWeight: 800,
        outline: "none",
        cursor: "pointer",
    };
    return (
            <button style={style} onClick={onClick} type="button" disabled={disabled}>
                {children}
            </button>
    );
}
