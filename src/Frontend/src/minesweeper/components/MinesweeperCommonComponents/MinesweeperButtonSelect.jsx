/**
 * @file MinesweeperButtonSelect.jsx
 * @brief A button select component for Minesweeper game settings.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React, {useState} from "react";
import colors from "../../../Colors";

/**
 * @brief A button select component for Minesweeper game settings.
 *
 * @param options Array of options (strings or objects with value and disabled properties).
 * @param selected Currently selected option.
 * @param onChange Callback function when an option is selected.
 */
function MinesweeperButtonSelect({
                                     options,
                                     selected,
                                     onChange
                                 }) {
    const [hoveredOption, setHoveredOption] = useState(null);

    const containerStyle = {
        display: "flex",
        gap: "clamp(4px, 0.6vw, 8px)",
        flexWrap: "wrap",
        justifyContent: "flex-end"
    };

    // Function to get button styles based on state
    const getButtonStyle = (option, isDisabled, isHovered) => ({
        padding: "clamp(5px, 0.7vw, 8px) clamp(10px, 1.2vw, 12px)",
        borderRadius: "clamp(13px, 2.1vw, 20px)",
        fontSize: "clamp(15px, 2.15vw, 24px)",
        fontWeight: "700",
        border: "none",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        backgroundColor: option === selected ? colors.white : colors.text_faded,
        color: option === selected ? colors.primary : colors.text,
        opacity: option === selected ? 1 : (isDisabled ? 0.5 : (isHovered ? 0.8 : 1)),
        whiteSpace: "nowrap"
    });

    return (
            <div style={containerStyle}>
                {options.map((opt) => {
                    const option = typeof opt === "string" ? opt : opt.value;
                    const isDisabled = typeof opt === "object" && opt.disabled;
                    const isHovered = hoveredOption === option;

                    return (
                            <button
                                    key={option}
                                    style={getButtonStyle(option, isDisabled, isHovered)}
                                    disabled={isDisabled}
                                    onClick={() => !isDisabled && onChange(option)}
                                    onMouseEnter={() => {
                                        if(option !== selected && !isDisabled) {
                                            setHoveredOption(option);
                                        }
                                    }}
                                    onMouseLeave={() => setHoveredOption(null)}
                            >
                                {option}
                            </button>
                    );
                })}
            </div>
    );
}

export default MinesweeperButtonSelect;
