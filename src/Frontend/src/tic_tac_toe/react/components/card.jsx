/**
 * @file    card.jsx
 * @brief   Generic card component used as a styled container for content blocks.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';
import colors from '../../../Colors';

/**
 * Reusable card container with optional title and customizable body styles.
 *
 * @param {object}          props
 * @param {string}          [props.title]    Optional card title.
 * @param {React.ReactNode} props.children   Content rendered inside the card.
 * @param {object}          [props.style]    Extra styles for the outer card.
 * @param {object}          [props.bodyStyle]Extra styles for the body content.
 */
export default function Card({ title, children, style, bodyStyle }) {
    const c = colors || {};

    return (
            <div
                    style={{
                        position: 'relative',
                        background: c.secondary || '#0F172A',
                        borderRadius: 40,
                        boxShadow:
                                '-2px 4px 14px rgba(255,255,255,0.15) inset, 0 6px 18px rgba(0,0,0,0.35)',
                        padding: 24,
                        ...style,
                    }}
            >
                {title && (
                        <div
                                style={{
                                    fontWeight: 800,
                                    fontSize: 26,
                                    lineHeight: '32px',
                                    color: c.text,
                                    textAlign: 'center',
                                    marginBottom: 12,
                                }}
                        >
                            {title}
                        </div>
                )}
                <div
                        style={{
                            color: c.text,
                            fontSize: 18,
                            lineHeight: '28px',
                            ...bodyStyle,
                        }}
                >
                    {children}
                </div>
            </div>
    );
}
