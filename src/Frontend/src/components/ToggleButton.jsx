/**
 * @file ToggleButton.jsx
 * @brief A simple toggle (switch) UI component implemented with inline styles.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React from 'react';
import colors from '../Colors';

/**
 * ToggleButton - A simple toggle (switch) UI component implemented with inline styles.
 *
 * Props:
 * - checked: boolean — current state of the toggle (on/off).
 * - onChange: (next:boolean) => void — callback invoked with the new state when user toggles.
 * - size?: 'sm' | 'md' | 'lg' — size of the toggle (default 'md').
 */

function ToggleButton({ checked, onChange, size = 'sm' }) {
    const handleClick = () => onChange && onChange(!checked);

    // Size configurations
    const sizeConfig = {
        sm: { width: 72, height: 40, padding: 3.5, circleSize: 33 },
        md: { width: 90, height: 50, padding: 4.5, circleSize: 41 },
        lg: { width: 108, height: 60, padding: 5.5, circleSize: 49 }
    };

    const config = sizeConfig[size];

    const containerStyle = {
        width: config.width,
        height: config.height,
        borderRadius: config.height / 2,
        border: `2px solid ${checked ? colors.text_header : colors.text_faded}`,
        backgroundColor: checked ? colors.text_header : colors.text_faded,
        display: 'flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        cursor: 'pointer',
        padding: config.padding,
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
        boxShadow: checked ? `0 0 0 1px ${colors.text_header}` : 'none',
    };

    const circleStyle = {
        width: config.circleSize,
        height: config.circleSize,
        borderRadius: '50%',
        backgroundColor: checked ? colors.primary : colors.text_header,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    };

    return (
            <div style={containerStyle} onClick={handleClick}>
                <div style={circleStyle} />
            </div>
    );
}

export default ToggleButton;
