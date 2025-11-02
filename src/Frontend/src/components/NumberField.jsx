// javascript
import React from 'react';
import colors from '../Colors';

/**
 * NumberField — numeric input with optional icon and parameterized sizing.
 *
 * Props:
 * - value: number | string — current input value (controlled)
 * - onChange: (n: number) => void — callback invoked with the parsed numeric value
 * - min?: number — optional minimum allowed value
 * - max?: number — optional maximum allowed value
 * - step?: number — step increment for the native input (default: 1)
 * - icon?: ReactNode — optional trailing icon element (e.g. <svg/>)
 * - inputWidth?: number — width of the input itself in px (default: 88)
 * - height?: number — height of the entire component in px (default: 40)
 * - padding?: number — inner horizontal padding in px (default: 10)
 * - fontSize?: number — font size in px (default: 18)
 * - borderRadius?: number — border radius in px (default: 12)
 */
function NumberField({
                         value,
                         onChange,
                         min,
                         max,
                         step = 1,
                         icon,
                         inputWidth = 88,
                         height = 40,
                         padding = 10,
                         fontSize = 18,
                         borderRadius = 12
                     }) {
    // Wrapper for the whole NumberField
    const wrap = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,                                              // gap between the input and the icon
        padding: `6px ${padding}px`,                         // fixed vertical padding, horizontal is parameterized
        height: height,
        borderRadius: borderRadius,
        border: '1px solid rgba(255,255,255,0.35)',         // subtle light border
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)', // inner light effect
        background: 'rgba(148,163,184,0.15)',               // semi-transparent background
        boxSizing: 'border-box',
    };

    // Style for the numeric input itself
    const input = {
        width: inputWidth,
        background: 'transparent',                           // transparent background
        border: 'none',                                     // no border (container provides it)
        outline: 'none',                                    // no outline on focus
        color: colors.text_header,                          // text color
        fontSize: fontSize,
        fontWeight: 700,                                    // bold font
        textAlign: 'right',                                 // text aligned right
    };

    // Container for the icon (if provided)
    const iconBox = {
        width: 22,
        height: 22,
        borderRadius: 6,                                    // slightly smaller radius than main container
        display: 'grid',
        placeItems: 'center',                               // center the icon
        background: 'rgba(255,255,255,0.15)',               // lighter background for the icon box
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)', // subtle inner border
    };

    // Handler for input value changes
    function handleChange(e) {
        const v = e.target.value;                           // get value from event
        const n = Number(v);                                // convert to number
        if (!Number.isNaN(n)) {                             // if it's a valid number
            let next = n;
            if (min != null) next = Math.max(min, next);   // enforce minimum if provided
            if (max != null) next = Math.min(max, next);   // enforce maximum if provided
            onChange?.(next);                               // call the callback
        }
    }

    return (
            <div style={wrap}>
                <input
                        type="number"
                        value={value}
                        min={min}
                        max={max}
                        step={step}
                        onChange={handleChange}
                        style={input}
                />
                {icon && <div style={iconBox}>{icon}</div>}
            </div>
    );
}

export default NumberField;
