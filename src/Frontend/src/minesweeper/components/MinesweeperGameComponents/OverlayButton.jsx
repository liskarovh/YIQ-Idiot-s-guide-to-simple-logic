import React from "react";

function OverlayButton({
                           icon,
                           onClick,
                           title,
                           ariaLabel,
                           size = 44,
                           style = {},
                           disabled = false
                       }) {
    const overlayButtonBaseStyle = {
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(20,20,20,0.7)",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        fontSize: typeof size === "number" ? Math.round(size * 0.45) : "20px",
        border: "none",
        padding: 0,
        zIndex: 10,
        boxSizing: "border-box"
    };

    const overlayButtonStyle = {...overlayButtonBaseStyle, ...style};

    return (
            <button
                    type="button"
                    onClick={disabled ? undefined : onClick}
                    title={title}
                    aria-label={ariaLabel || title}
                    disabled={disabled}
                    style={overlayButtonStyle}
            >
                    {icon}
            </button>
    );
}

export default OverlayButton;
