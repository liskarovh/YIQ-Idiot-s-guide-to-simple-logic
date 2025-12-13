import React, {useMemo, useEffect, useState, useRef} from "react";
import colors from "../Colors";

/**
 * @brief NumberField is a styled numeric input component with increment/decrement
 *        buttons.
 * @details It supports minValue/maxValue bounds, step, custom digit width, and
 *          can display zero as infinity.
 *
 * @param value Current presetValue of the field.
 * @param minValue Minimum allowed presetValue.
 * @param maxValue Maximum allowed presetValue.
 * @param maxDigits Maximum number of digits to display (default: 3).
 * @param onChange Callback when presetValue changes.
 * @param step Step for increment/decrement (default: 1).
 * @param height Height of the input (default: 40).
 * @param padding Horizontal padding (default: 10).
 * @param fontSize Font size (default: 18).
 * @param borderRadius Border radius (default: 12).
 * @param zeroAsInfinity If true, display zero as ∞ (default: false).
 * @param commitDelay Delay in ms before committing input changes (default: 1000).
 */
function NumberField({
                         value,
                         minValue,
                         maxValue,
                         maxDigits = 3,
                         onChange,
                         step = 1,
                         height = 40,
                         padding = 10,
                         fontSize = 18,
                         borderRadius = 12,
                         zeroAsInfinity = false,
                         commitDelay = 1000
                     }) {
    // Local editable text state so user can type multi-digit numbers
    const [inputValue, setInputValue] = useState(() => {
        return zeroAsInfinity && value === 0 ? "∞" : String(value ?? "");
    });
    const [editing, setEditing] = useState(false);
    const commitTimer = useRef(null);
    const inputRef = useRef(null);


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

    const inputStyle = {
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
    const showInfinity = zeroAsInfinity && value === 0;
    const displayValue = editing ? inputValue
                                 : showInfinity ? "∞"
                                                : String(value ?? "");

    // Sync external value into local input when not editing
    useEffect(() => {
        if(editing) {
            return;
        }

        setInputValue(showInfinity ? "∞" : String(value ?? ""));
    }, [value, editing, showInfinity]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if(commitTimer.current) {
                clearTimeout(commitTimer.current);
                commitTimer.current = null;
            }
        };
    }, []);

    // Commit logic - Parse, clamp and call onChange if needed
    function commitInput(maybeValue) {
        // Clear any existing timer
        if(commitTimer.current) {
            clearTimeout(commitTimer.current);
            commitTimer.current = null;
        }

        // Use passed value or current input
        let text = maybeValue ?? inputValue;
        if(zeroAsInfinity && text === "∞") {
            text = "0";
        }

        // If empty, revert to current value
        if(text === "" || text == null) {
            // Restore display from given value
            setInputValue(showInfinity ? "∞" : String(value ?? ""));
            return;
        }

        // Parse number
        const parsed = Number(text);

        // If invalid number, revert to current value
        if(Number.isNaN(parsed)) {
            setInputValue(showInfinity ? "∞" : String(value ?? ""));
            return;
        }

        // Clamp within min/max
        let nextNumber = parsed;
        if(minValue != null) {
            nextNumber = Math.max(minValue, nextNumber);
        }
        if(maxValue != null) {
            nextNumber = Math.min(maxValue, nextNumber);
        }

        // Only call onChange if different
        if(nextNumber !== value) {
            onChange?.(nextNumber);
        }

        // Reflect final value in local input
        setInputValue(zeroAsInfinity && nextNumber === 0 ? "∞" : String(nextNumber));
    }

    // Debounced commit when user types
    useEffect(() => {
        if(!editing) {
            return;
        }
        if(commitTimer.current) {
            clearTimeout(commitTimer.current);
        }
        commitTimer.current = setTimeout(() => {
            commitInput();
        }, commitDelay);

        return () => {
            if(commitTimer.current) {
                clearTimeout(commitTimer.current);
                commitTimer.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue]);

    // Handle manual input change (local only)
    function handleChange(event) {
        const raw = event.target.value;

        // Allow digits, optional leading -, empty string and the infinity char
        if(raw === "" || raw === "-" || raw === "∞") {
            setInputValue(raw);
            return;
        }

        // If numeric, keep it
        const num = Number(raw);

        if(!Number.isNaN(num)) {
            setInputValue(raw);
        }

        // Otherwise ignore (prevents letters)
    }

    // Handlers to manage commit
    function handleFocus() {
        setEditing(true);
    }

    function handleBlur() {
        // Commit immediately on blur and end editing
        commitInput();
        setEditing(false);
    }

    // Wheel handler
    function handleWheel(event) {
        if(!inputRef.current) {
            return;
        }

        // Only when pointer is over our input container
        // deltaY < 0 => scroll up => increment
        if(event.deltaY < 0) {
            event.preventDefault();
            increment();
        }
        // deltaY > 0 => scroll down => decrement
        else if(event.deltaY > 0) {
            event.preventDefault();
            decrement();
        }
    }

    // Immediate increment/decrement (buttons & wheel) operate, respecting min/max.
    function increment() {
        // If current value is invalid, treat as 0
        const base = (typeof value === "number" && !Number.isNaN(value)) ? value : 0;

        // Calculate next value
        let next = base + step;

        // Clamp to max
        if(maxValue != null) {
            next = Math.min(maxValue, next);
        }

        onChange?.(next);
    }

    function decrement() {
        // If current value is invalid, treat as 0
        const base = (typeof value === "number" && !Number.isNaN(value)) ? value : 0;

        // Calculate next value
        let next = base - step;

        // Clamp to min
        if(minValue != null) {
            next = Math.max(minValue, next);
        }

        onChange?.(next);
    }

    return (
            <div style={wrap}
                 onWheel={handleWheel}
            >
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
                            ref={inputRef}
                            type="text"
                            value={displayValue}
                            min={minValue}
                            max={maxValue}
                            step={step}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            style={inputStyle}
                    />
                    <div style={spinnerContainer}>
                        <button
                                style={arrowButton}
                                onClick={increment}
                                disabled={maxValue != null && value >= maxValue}
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
                                disabled={minValue != null && value <= minValue}
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
