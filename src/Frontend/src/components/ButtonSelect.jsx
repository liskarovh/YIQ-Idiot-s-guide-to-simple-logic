import React, {useState} from "react";
import colors from "../Colors";

/**
 * BUTTON SELECT COMPONENT - Unified Pill Style
 * Matches the aesthetic of Strategy.jsx
 *
 * Props:
 * - options: array of strings - Available options
 * - selected: string - Currently selected option
 * - onChange: function - Called with selected option value
 * - style: object - Optional overrides
 */
function ButtonSelect({
    options,
    selected,
    onChange,
    style = {}
}) {
    const [hoveredOption, setHoveredOption] = useState(null);

    const containerStyle = {
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
        justifyContent: "flex-start", // Aligned start for better reading flow in settings
        ...style
    };

    const getButtonStyle = (option, isDisabled, isHovered) => {
        const isActive = option === selected;
        
        // Colors derived from Strategy.jsx style
        // Active: Light Blue-White background, Dark Text
        // Inactive: Translucent background, Light Text
        const activeBg = '#d8e0eb';
        const inactiveBg = 'rgba(255, 255, 255, 0.05)';
        const activeColor = '#0f172a';
        const inactiveColor = '#d8e0eb';

        return {
            padding: '0.5rem 1.2rem',
            borderRadius: '999px', // Pill shape
            fontSize: '0.9rem',
            fontWeight: '600',
            border: 'none',
            cursor: isDisabled ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            
            backgroundColor: isActive ? activeBg : (isHovered && !isDisabled ? 'rgba(255, 255, 255, 0.1)' : inactiveBg),
            color: isActive ? activeColor : inactiveColor,
            opacity: isDisabled ? 0.5 : 1,
            
            // Prevent text selection
            userSelect: 'none',
            // Ensure buttons don't shrink too much on mobile
            flexShrink: 0,
            whiteSpace: 'nowrap'
        };
    };

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