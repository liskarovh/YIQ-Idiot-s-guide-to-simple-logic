/**
 * @file    markX.jsx
 * @brief   React component that renders the X player mark as an SVG graphic.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';

/**
 * SVG-based X mark for the Tic-Tac-Toe board.
 *
 * @param {object}        props
 * @param {number|string} [props.size]   Optional width/height for the icon.
 * @param {string}        [props.color]  Stroke color of the lines (default '#FF6B6B').
 * @param {object}        [props.style]  Additional inline styles. If style.width/height
 *                                      is provided, it takes precedence over `size`.
 */
export default function MarkX({ size, color = '#FF6B6B', style }) {
    const dim = size ? { width: size, height: size } : {};
    const s = 64;   // viewBox size
    const w = 8;    // stroke width
    const p = 12;   // padding from edges

    return (
            <svg
                    viewBox={`0 0 ${s} ${s}`}
                    style={{ display: 'block', ...dim, ...style }}
                    aria-hidden="true"
            >
                <line
                        x1={p}
                        y1={p}
                        x2={s - p}
                        y2={s - p}
                        stroke={color}
                        strokeWidth={w}
                        strokeLinecap="round"
                />
                <line
                        x1={s - p}
                        y1={p}
                        x2={p}
                        y2={s - p}
                        stroke={color}
                        strokeWidth={w}
                        strokeLinecap="round"
                />
            </svg>
    );
}
