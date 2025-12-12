/**
 * @file    pill.jsx
 * @brief   Reusable clickable pill-style button component.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';
import colors from '../../../Colors';

export default function Pill({ active = false, onClick, children, style }) {
    const c = colors || {};

    return (
            <button
                    type="button"
                    onClick={onClick}
                    style={{
                        padding: '13px 28px',
                        borderRadius: 40,
                        fontWeight: 700,
                        fontSize: 18,
                        lineHeight: '22px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(15,23,42,0.35)',
                        // active pill inverted compared to base
                        background: active ? c.text : c.secondary,
                        color: active ? c.secondary : c.text,
                        transition: 'transform .12s ease, box-shadow .12s ease',
                        ...style,
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateY(1px)';
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
            >
                {children}
            </button>
    );
}
