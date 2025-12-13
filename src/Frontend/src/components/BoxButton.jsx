import {createElement, useState} from "react";
import colors from "../Colors";

/**
 * @brief Configurable button with optional icon.
 *
 * @param title Button title text.
 * @param icon Optional icon component or JSX element.
 * @param width Button width (default: "auto").
 * @param height Button height (default: "auto").
 * @param background Button background color (default: colors.secondary).
 * @param color Button text color (default: colors.text_header).
 * @param disabled If true, button is disabled (default: false).
 * @param onClick Click event handler.
 * @param style Additional CSS styles to apply.
 */
function BoxButton({
                       title,
                       icon = undefined,
                       width,
                       height,
                       background = colors.secondary,
                       color = colors.text_header,
                       disabled = false,
                       onClick,
                       style = {}
                   }) {
    const [isHovered, setIsHovered] = useState(false);

    const defaultStyle = {
        display: "inline-flex",
        width: width || "auto",
        height: height || "auto",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
        borderRadius: "25px",
        padding: "15px 38px 15px 25px",
        background: background,
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "-4px 3px 4px rgba(255, 255, 255, 0.25)",
        color: color,
        fontWeight: 800,
        fontSize: 32,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : (isHovered ? 0.8 : 1),
        transform: isHovered && !disabled ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.2s",
        ...style
    };

    const iconElement = icon
                        ? (typeof icon === "function" ? createElement(icon) : icon)
                        : null;

    return (
            <button
                    style={defaultStyle}
                    onClick={disabled ? undefined : onClick}
                    onMouseEnter={() => !disabled && setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    disabled={disabled}
            >
                {iconElement}
                {title}
            </button>
    );
}

export default BoxButton;
