/**
 * @file    MarkO.jsx
 * @brief   React component that renders the O player mark as an SVG graphic.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';

/**
 * SVG-based O mark for the Tic-Tac-Toe board.
 *
 * @param {object}        props
 * @param {number|string} [props.size]   Optional width/height for the icon.
 * @param {string}        [props.color]  Stroke color of the circle (default '#5AD3FF').
 * @param {object}        [props.style]  Additional inline styles.
 */
export default function MarkO({ size, color = '#5AD3FF', style }) {
    const dim = size ? { width: size, height: size } : {};
    const s = 64;      // viewBox size
    const w = 7;       // stroke width
    const r = 22;      // circle radius

    return (
            <svg
                    viewBox={`0 0 ${s} ${s}`}
                    style={{ display: 'block', ...dim, ...style }}
                    aria-hidden="true"
            >
                <circle
                        cx={s / 2}
                        cy={s / 2}
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={w}
                />
            </svg>
    );
}
