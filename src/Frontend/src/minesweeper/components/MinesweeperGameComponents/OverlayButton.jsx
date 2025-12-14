import {useState} from "react";

function OverlayButton({
                           icon,
                           onClick,
                           title,
                           ariaLabel,
                           hoverContent,
                           size = 44,
                           style = {},
                           disabled = false
                       }) {
    const [showHover, setShowHover] = useState(false);

    const overlayButtonBaseStyle = {
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#212535",
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

    const hoverOverlayStyle = {
        position: "absolute",
        top: size + 12,
        right: 12,
        marginTop: "8px",
        zIndex: 1000,
        pointerEvents: "none"
    };

    return (
            <div onMouseEnter={() => hoverContent && setShowHover(true)}
                 onMouseLeave={() => setShowHover(false)}
            >
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

                {showHover && hoverContent && (
                        <div style={hoverOverlayStyle}>
                            {hoverContent}
                        </div>
                )}
            </div>
    );
}

export default OverlayButton;
