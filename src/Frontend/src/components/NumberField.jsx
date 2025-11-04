import React, {useMemo} from "react";
import colors from "../Colors";

/**
 * NumberField is a styled numeric input component with increment/decrement buttons.
 * It supports minValue/maxValue bounds, step, custom digit width, and can display zero as infinity.
 *
 * @param {Object} props
 * @param {number} presetValue - Current presetValue of the field.
 * @param {number} minValue - Minimum allowed presetValue.
 * @param {number} maxValue - Maximum allowed presetValue.
 * @param {number} [maxDigits=3] - Maximum number of digits to display.
 * @param {function} onChange - Callback when presetValue changes.
 * @param {number} [step=1] - Step for increment/decrement.
 * @param {number} [height=40] - Height of the input.
 * @param {number} [padding=10] - Horizontal padding.
 * @param {number} [fontSize=18] - Font size.
 * @param {number} [borderRadius=12] - Border radius.
 * @param {boolean} [zeroAsInfinity=false] - If true, display zero as ∞.
 */
function NumberField({
                         presetValue,
                         minValue,
                         maxValue,
                         maxDigits = 3,
                         onChange,
                         step = 1,
                         height = 40,
                         padding = 10,
                         fontSize = 18,
                         borderRadius = 12,
                         zeroAsInfinity = false
                     }) {

    // Calculate input width based on maxDigits or min/max values
    const inputWidth = useMemo(() => {
        let digits = maxDigits;

        // If not explicitly set, calculate from min/max
        if(!digits && (maxValue != null || minValue != null)) {
            const maxVal = Math.max(
                    Math.abs(maxValue ?? 0),
                    Math.abs(minValue ?? 0)
            );

            digits = maxVal.toString().length;
        }

        // At least 2 digits, add space for ∞ if needed
        digits = Math.max(digits || 2, zeroAsInfinity ? 1 : 0);

        // Each digit ~14px
        return digits * 14;
    }, [maxValue, minValue, zeroAsInfinity, maxDigits]);

    // Styles for the component
    const wrap = {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: `6px ${padding}px`,
        height: height,
        borderRadius: borderRadius,
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
        background: colors.secondary,
        boxSizing: "border-box"
    };

    const inputContainer = {
        position: "relative",
        display: "inline-flex",
        alignItems: "center"
    };

    const input = {
        width: inputWidth,
        background: "transparent",
        border: "none",
        outline: "none",
        color: colors.text_header,
        fontSize: fontSize,
        fontWeight: 700,
        textAlign: "center",
        MozAppearance: "textfield",
        paddingRight: 28
    };

    const spinnerContainer = {
        position: "absolute",
        right: 2,
        display: "flex",
        flexDirection: "column",
        gap: 3
    };

    const arrowButton = {
        width: 20,
        height: 14,
        background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.12) 100%)",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: 4,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        color: colors.text_header,
        fontSize: 9,
        transition: "all 0.15s ease",
        userSelect: "none",
        boxShadow: "0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
        position: "relative",
        overflow: "hidden"
    };

    const arrowIcon = {
        fontSize: 8,
        lineHeight: 1,
        opacity: 0.85,
        fontWeight: 900
    };

    // If zeroAsInfinity is true and value is 0, show ∞
    const showInfinity = zeroAsInfinity && presetValue === 0;
    const displayValue = showInfinity ? "∞" : presetValue;

    // Handle manual input change.
    function handleChange(event) {
        const valueString = event.target.value;
        const valueNumber = Number(valueString);
        if(!Number.isNaN(valueNumber)) {
            let nextNumber = valueNumber;
            if(minValue != null) {
                nextNumber = Math.max(minValue, nextNumber);
            }
            if(maxValue != null) {
                nextNumber = Math.min(maxValue, nextNumber);
            }
            onChange?.(nextNumber);
        }
    }

    // Increment value by step, respecting max.
    function increment() {
        let nextNumber = presetValue + step;
        if(maxValue != null) {
            nextNumber = Math.min(maxValue, nextNumber);
        }
        onChange?.(nextNumber);
    }

    // Decrement value by step, respecting min.
    function decrement() {
        let next = presetValue - step;
        if(minValue != null) {
            next = Math.max(minValue, next);
        }
        onChange?.(next);
    }

    return (
            <div style={wrap}>
                {/* Hide default browser number spinners */}
                <style>
                    {`
                        input[type="number"]::-webkit-inner-spin-button,
                        input[type="number"]::-webkit-outer-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                        }
                    `}
                </style>
                <div style={inputContainer}>
                    <input
                            type="text"
                            value={displayValue}
                            min={minValue}
                            max={maxValue}
                            step={step}
                            onChange={handleChange}
                            style={input}
                    />
                    <div style={spinnerContainer}>
                        <button
                                style={arrowButton}
                                onClick={increment}
                                disabled={maxValue != null && presetValue >= maxValue}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%)";
                                    e.currentTarget.style.transform = "scale(1.05)";
                                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.12) 100%)";
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)";
                                }}
                                onMouseDown={(e) => {
                                    e.currentTarget.style.transform = "scale(0.95)";
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.transform = "scale(1.05)";
                                }}
                        >
                            <span style={arrowIcon}>▲</span>
                        </button>
                        <button
                                style={arrowButton}
                                onClick={decrement}
                                disabled={minValue != null && presetValue <= minValue}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%)";
                                    e.currentTarget.style.transform = "scale(1.05)";
                                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.12) 100%)";
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)";
                                }}
                                onMouseDown={(e) => {
                                    e.currentTarget.style.transform = "scale(0.95)";
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.transform = "scale(1.05)";
                                }}
                        >
                            <span style={arrowIcon}>▼</span>
                        </button>
                    </div>
                </div>
            </div>
    );
}

export default NumberField;
