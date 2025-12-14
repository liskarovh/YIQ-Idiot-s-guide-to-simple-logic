/**
 * @file MinesweeperNumberField.jsx
 * @brief A styled numeric input component with increment/decrement buttons for Minesweeper game.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React, {useMemo, useEffect, useState, useRef} from "react";
import colors from "../../../Colors";

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
 * @param zeroAsInfinity If true, display zero as ∞ (default: false).
 * @param commitDelay Delay in ms before committing input changes (default: 1000).
 */
function MinesweeperNumberField({
                                    value,
                                    minValue,
                                    maxValue,
                                    maxDigits = 3,
                                    onChange,
                                    step = 1,
                                    zeroAsInfinity = false,
                                    commitDelay = 600
                                }) {
    // State to track the current input value as a string
    const [inputValue, setInputValue] = useState(() => {
        return zeroAsInfinity && value === 0 ? "∞" : String(value ?? "");
    });

    // State to track if the input is being edited
    const [editing, setEditing] = useState(false);
    const commitTimer = useRef(null);
    const inputRef = useRef(null);

    // Calculate input width based on maxDigits or value range
    const inputWidth = useMemo(() => {
        let digits = maxDigits;

        if(!digits && (maxValue != null || minValue != null)) {
            const maxVal = Math.max(
                    Math.abs(maxValue ?? 0),
                    Math.abs(minValue ?? 0)
            );
            digits = maxVal.toString().length;
        }

        digits = Math.max(digits || 2, zeroAsInfinity ? 1 : 0);
        return `clamp(${digits * 10}px, ${digits * 1.4}vw, ${digits * 14}px)`;
    }, [maxValue, minValue, zeroAsInfinity, maxDigits]);

    const containerWrapStyle = {
        display: "inline-flex",
        alignItems: "center",
        gap: "clamp(6px, 1vw, 8px)",
        padding: "clamp(4px, 0.8vw, 6px) clamp(8px, 1.2vw, 10px)",
        height: "clamp(32px, 5vw, 40px)",
        borderRadius: "clamp(10px, 1.5vw, 12px)",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
        background: colors.secondary,
        boxSizing: "border-box"
    };

    const inputContainerStyle = {
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
        fontSize: "clamp(14px, 2.2vw, 18px)",
        fontWeight: 700,
        textAlign: "center",
        MozAppearance: "textfield",
        paddingRight: "clamp(22px, 3.5vw, 28px)"
    };

    const spinnerContainer = {
        position: "absolute",
        right: 2,
        display: "flex",
        flexDirection: "column",
        gap: "clamp(2px, 0.4vw, 3px)"
    };

    const arrowButton = {
        width: "clamp(16px, 2.5vw, 20px)",
        height: "clamp(11px, 1.7vw, 14px)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.12) 100%)",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: "clamp(3px, 0.5vw, 4px)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        color: colors.text_header,
        fontSize: "clamp(7px, 1.1vw, 9px)",
        transition: "all 0.15s ease",
        userSelect: "none",
        boxShadow: "0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
        position: "relative",
        overflow: "hidden"
    };

    const arrowIcon = {
        fontSize: "clamp(6px, 1vw, 8px)",
        lineHeight: 1,
        opacity: 0.85,
        fontWeight: 900
    };

    // Determine if we should show infinity symbol
    const showInfinity = zeroAsInfinity && value === 0;
    const displayValue = editing ? inputValue
                                 : showInfinity ? "∞"
                                                : String(value ?? "");

    // Sync inputValue with value prop when not editing
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

    // Commit the input value after delay or on blur
    function commitInput(maybeValue) {
        if(commitTimer.current) {
            clearTimeout(commitTimer.current);
            commitTimer.current = null;
        }

        let text = maybeValue ?? inputValue;
        if(zeroAsInfinity && text === "∞") {
            text = "0";
        }

        if(text === "" || text == null) {
            setInputValue(showInfinity ? "∞" : String(value ?? ""));
            return;
        }

        const parsed = Number(text);
        if(Number.isNaN(parsed)) {
            setInputValue(showInfinity ? "∞" : String(value ?? ""));
            return;
        }

        let nextNumber = parsed;
        if(minValue != null) {
            nextNumber = Math.max(minValue, nextNumber);
        }
        if(maxValue != null) {
            nextNumber = Math.min(maxValue, nextNumber);
        }

        if(nextNumber !== value) {
            onChange?.(nextNumber);
        }
        setInputValue(zeroAsInfinity && nextNumber === 0 ? "∞" : String(nextNumber));
    }

    // Set up delayed commit when inputValue changes
    useEffect(() => {
        if(!editing) {
            return;
        }
        if(commitTimer.current) {
            clearTimeout(commitTimer.current);
        }
        commitTimer.current = setTimeout(() => commitInput(), commitDelay);

        return () => {
            if(commitTimer.current) {
                clearTimeout(commitTimer.current);
                commitTimer.current = null;
            }
        };
    }, [inputValue]);

    // Handle input changes
    function handleChange(event) {
        const raw = event.target.value;
        if(raw === "" || raw === "-" || raw === "∞") {
            setInputValue(raw);
            return;
        }
        const num = Number(raw);
        if(!Number.isNaN(num)) {
            setInputValue(raw);
        }
    }

    // Handle focus event
    function handleFocus() {
        setEditing(true);
    }

    // Handle blur event
    function handleBlur() {
        commitInput();
        setEditing(false);
    }

    // Handle mouse wheel events for increment/decrement
    function handleWheel(event) {
        if(!inputRef.current) {
            return;
        }
        if(event.deltaY < 0) {
            event.preventDefault();
            increment();
        }
        else if(event.deltaY > 0) {
            event.preventDefault();
            decrement();
        }
    }

    // Increment the value
    function increment() {
        const base = (typeof value === "number" && !Number.isNaN(value)) ? value : 0;
        let next = base + step;
        if(maxValue != null) {
            next = Math.min(maxValue, next);
        }
        onChange?.(next);
    }

    // Decrement the value
    function decrement() {
        const base = (typeof value === "number" && !Number.isNaN(value)) ? value : 0;
        let next = base - step;
        if(minValue != null) {
            next = Math.max(minValue, next);
        }
        onChange?.(next);
    }

    return (
            <div style={containerWrapStyle}
                 onWheel={handleWheel}
            >
                {/* Hide default number input spinners */}
                <style>
                    {`
                    input[type="number"]::-webkit-inner-spin-button,
                    input[type="number"]::-webkit-outer-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                `}
                </style>
                <div style={inputContainerStyle}>
                    <input ref={inputRef}
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
                        <button style={arrowButton}
                                onClick={increment}
                                disabled={maxValue != null && value >= maxValue}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%)";
                                    e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.12) 100%)";
                                    e.currentTarget.style.transform = "scale(1)";
                                }}
                        >
                            <span style={arrowIcon}>▲</span>
                        </button>
                        <button style={arrowButton}
                                onClick={decrement}
                                disabled={minValue != null && value <= minValue}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%)";
                                    e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.12) 100%)";
                                    e.currentTarget.style.transform = "scale(1)";
                                }}
                        >
                            <span style={arrowIcon}>▼</span>
                        </button>
                    </div>
                </div>
            </div>
    );
}

export default MinesweeperNumberField;
