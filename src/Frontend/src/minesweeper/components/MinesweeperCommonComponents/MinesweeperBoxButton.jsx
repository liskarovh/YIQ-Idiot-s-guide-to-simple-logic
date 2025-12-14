/**
 * @file MinesweeperBoxButton.jsx
 * @brief A configurable button component with optional icon for the Minesweeper game.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import {createElement, useState} from "react";
import colors from "../../../Colors";

/**
 * @brief Configurable button with optional icon.
 *
 * @param title Button title text.
 * @param icon Optional icon component or JSX element.
 * @param background Button background color (default: colors.secondary).
 * @param color Button text color (default: colors.text_header).
 * @param disabled If true, button is disabled (default: false).
 * @param onClick Click event handler.
 * @param style Additional CSS styles to apply.
 */
function MinesweeperBoxButton({
                                  title,
                                  icon = undefined,
                                  background = colors.secondary,
                                  color = colors.text_header,
                                  disabled = false,
                                  onClick,
                                  style = {}
                              }) {
    const [isHovered, setIsHovered] = useState(false);

    const defaultStyle = {
        display: "inline-flex",
        width: "auto",
        height: "auto",
        justifyContent: "center",
        alignItems: "center",
        gap: "clamp(10px, 1.7vw, 14px)",
        borderRadius: "clamp(20px, 3.1vw, 25px)",
        padding: "clamp(12px, 1.9vw, 15px) clamp(30px, 4.7vw, 38px) clamp(12px, 1.9vw, 15px) clamp(20px, 3.1vw, 25px)",
        background: background,
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "-4px 3px 4px rgba(255, 255, 255, 0.25)",
        color: color,
        fontWeight: 800,
        fontSize: "clamp(24px, 4vw, 32px)",
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

export default MinesweeperBoxButton;
