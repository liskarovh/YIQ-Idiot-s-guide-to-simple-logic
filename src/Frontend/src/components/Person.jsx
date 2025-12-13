/**
 * @file Person.jsx
 * @brief Person row component (letter avatar + left-aligned name + blue link).
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { useMemo } from 'react';

import styles from '../Styles';
import colors from '../Colors';

export default function Person({ name, initial, href = null }) {
    const letter = useMemo(() => {
        const s = String(initial ?? name?.[0] ?? '?');
        return s.length ? s[0].toUpperCase() : '?';
    }, [initial, name]);

    // Everything responsive (relative) via CSS clamp/vw
    const avatarSize = 'clamp(40px, 6vw, 56px)';
    const gap = 'clamp(12px, 3vw, 40px)';
    const linkTop = 'clamp(6px, 1.2vw, 10px)';

    const row = {
        display: 'grid',
        gridTemplateColumns: `${avatarSize} auto`, // text column won't stretch away
        gap,
        alignItems: 'center',
        justifyContent: 'start',
    };

    const avatar = {
        width: avatarSize,
        height: avatarSize,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.86)',
        color: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: 'clamp(20px, 3.2vw, 26px)', // responsive letter size
        boxShadow: '0 10px 26px rgba(0,0,0,0.25)',
        userSelect: 'none',
        flex: '0 0 auto',
    };

    const info = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        textAlign: 'left',
        minWidth: 0,
    };

    const nameStyle = {
        ...styles.subtitleStyle,
        margin: 0,
        color: colors.text,
        fontWeight: 800,
        fontSize: 'clamp(18px, 2.4vw, 26px)',
        lineHeight: 1.15,
    };

    const linkStyle = {
        ...styles.subtitleStyle,
        margin: `${linkTop} 0 0`,
        fontSize: 'clamp(14px, 1.9vw, 18px)',
        fontWeight: 600,
        lineHeight: 1.2,
        color: '#4EA1FF',
        textDecoration: 'none',
        opacity: 0.95,
        overflowWrap: 'anywhere',
        maxWidth: 'min(520px, 60vw)',
    };

    return (
            <div style={row}>
                <div style={avatar} aria-hidden="true">
                    {letter}
                </div>

                <div style={info}>
                    <p style={nameStyle}>{name}</p>

                    {href && (
                            <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={linkStyle}
                                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                            >
                                {href}
                            </a>
                    )}
                </div>
            </div>
    );
}
