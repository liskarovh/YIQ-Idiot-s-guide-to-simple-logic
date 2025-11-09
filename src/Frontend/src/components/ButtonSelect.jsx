import React from "react";
import colors from "../Colors";

/**
 * BUTTON SELECT COMPONENT - Custom select that looks like buttons
 *
 * Props:
 * - options: array of strings - Available options
 * - selected: string - Currently selected option
 * - onChange: function - Called with selected option value
 */
function ButtonSelect({
                          options,
                          selected,
                          onChange
                      }) {
    const [hoveredOption, setHoveredOption] = React.useState(null);

    const containerStyle = {
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
        justifyContent: "flex-end"
    };

    const getButtonStyle = (option, isDisabled, isHovered) => ({
        padding: "0.5rem 0.75rem",
        borderRadius: "20px",
        fontSize: "24px",
        fontWeight: "700",
        border: "none",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        backgroundColor: option === selected ? colors.white : colors.text_faded,
        color: option === selected ? colors.primary : colors.text,
        opacity: option === selected ? 1 : (isDisabled ? 0.5 : (isHovered ? 0.8 : 1))
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
                                    onMouseLeave={() => {
                                        setHoveredOption(null);
                                    }}
                            >
                                {option}
                            </button>
                    );
                })}
            </div>
    );
}

export default ButtonSelect;
