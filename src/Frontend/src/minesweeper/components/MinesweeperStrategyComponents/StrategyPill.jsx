/**
 * @file StrategyPill.jsx
 * @brief A React component representing a clickable pill-shaped button for strategy selection.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import {useState} from "react";
import colors from "../../../Colors";

function StrategyPill({active = false, onClick, children, style}) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const translate = isPressed ? "translateY(1px)"
                                : isHovered ? "translateY(-2px)"
                                            : "translateY(0)";

    const strategyPillStyle = {
        padding: "13px 28px",
        borderRadius: 40,
        fontWeight: 700,
        fontSize: 18,
        lineHeight: "22px",
        cursor: "pointer",
        boxShadow: "-3px 2px 4px rgba(255, 255, 255, 0.25)",
        background: active ? colors.text : colors.secondary,
        color: active ? colors.secondary : colors.text,
        transition: "transform .12s ease, box-shadow .12s ease, color .12s ease",
        display: "inline-block",
        willChange: "transform",
        transform: translate,
        ...style
    };

    return (
            <button
                    type="button"
                    onClick={onClick}
                    style={strategyPillStyle}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => {
                        setIsHovered(false);
                        setIsPressed(false);
                    }}
                    onMouseDown={() => setIsPressed(true)}
                    onMouseUp={() => setIsPressed(false)}
            >
                {children}
            </button>
    );
}

export default StrategyPill;
