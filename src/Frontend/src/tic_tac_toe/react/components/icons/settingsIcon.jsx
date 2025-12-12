/**
 * @file    settingsIcon.jsx
 * @brief   React component that renders the settings SVG icon.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';
import src from '../../../../assets/tic_tac_toe/settings.svg';

/**
 * Stateless icon component for the settings action.
 *
 * @param {object}        props
 * @param {number|string} [props.size]      Optional width/height for the icon.
 * @param {string}        [props.className] Optional CSS class name.
 * @param {object}        [props.style]     Optional inline styles.
 */
export default function SettingsIcon({ size, className, style }) {
    const dim = size ? { width: size, height: size } : {};
    return (
            <img
                    src={src}
                    alt=""
                    aria-hidden="true"
                    className={className}
                    style={{ display: 'block', ...dim, ...style }}
            />
    );
}
