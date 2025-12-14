import {useLayoutEffect, useRef, useState} from "react";
import colors from "../../../Colors";

/**
 * @brief A toggle button component for Minesweeper settings.
 *
 * @param checked Whether the toggle is on or off.
 * @param onChange Callback function when the toggle state changes.
 * @param maxHeight Optional maximum height for scaling the button.
 */
function MinesweeperToggleButton({checked, onChange, maxHeight}) {
    // Refs and state for scaling
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [scale, setScale] = useState(1);

    // Effect to handle scaling based on maxHeight
    useLayoutEffect(() => {
        if(!maxHeight) {
            setScale(1);
            return;
        }
        // Get the natural height of the content
        const element = contentRef.current;
        if(!element) {
            return;
        }

        // Temporarily reset transform to get natural height
        const previous = element.style.transform;
        element.style.transform = "none";
        const natural = element.scrollHeight || 1;
        const target = Math.max(0, maxHeight - 8);
        element.style.transform = previous;

        // Calculate scale factor
        const scale = Math.min(1, target / natural);
        setScale(scale > 0.98 ? 1 : scale);
    }, [maxHeight, checked]);

    // Handle click event to toggle the state
    const handleClick = () => onChange && onChange(!checked);

    // Handle keydown event for accessibility
    const handleKeyDown = (event) => {
        if(event.key === " " || event.key === "Enter") {
            event.preventDefault();
            handleClick();
        }
    };

    // Styles
    const containerWrapStyle = {
        display: "inline-block",
        lineHeight: 0,
        maxHeight: maxHeight ? `${maxHeight}px` : undefined,
        overflow: "hidden"
    };

    const containerStyle = {
        width: "clamp(60px, 8vw, 80px)",
        height: "clamp(34px, 4.5vw, 44px)",
        borderRadius: "clamp(17px, 2.25vw, 22px)",
        padding: "clamp(3px, 0.45vw, 4px)",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
        border: `2px solid ${checked ? colors.text_header : colors.text_faded}`,
        backgroundColor: checked ? colors.text_header : colors.text_faded,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: checked ? `0 0 0 1px ${colors.text_header}` : "none",
        userSelect: "none"
    };

    const contentWrapStyle = {
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        maxWidth: "100%"
    };

    const thumbStyle = {
        width: "clamp(28px, 3.6vw, 36px)",
        height: "clamp(28px, 3.6vw, 36px)",
        borderRadius: "50%",
        backgroundColor: checked ? colors.primary : colors.text_header,
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        transition: "all 0.2s ease"
    };

    return (
            <div ref={containerRef}
                 style={containerWrapStyle}
            >
                <div ref={contentRef}
                     style={contentWrapStyle}
                >
                    <div role="switch"
                         aria-checked={!!checked}
                         tabIndex={0}
                         onClick={handleClick}
                         onKeyDown={handleKeyDown}
                         style={containerStyle}
                    >
                        <div style={thumbStyle} />
                    </div>
                </div>
            </div>
    );
}

export default MinesweeperToggleButton;
