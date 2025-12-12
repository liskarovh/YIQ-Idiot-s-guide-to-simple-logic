/**
 * @file    winnerInfoPanelBase.jsx
 * @brief   Shared base component for winner info panels (X/O winners).
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { useRef } from 'react';
import Box from '../../../../../components/Box';
import styles from '../../../../../Styles';
import colors from '../../../../../Colors';
import {
    useInfoPanelScale,
    useInfoPanelBadgeSize,
} from '../../../hooks/useInfoPanelLayout';
import PlayerBadge from '../../playerBadge.jsx';

export default function WinnerInfoPanelBase({
                                                kind,               // 'X' | 'O'
                                                winnerLabel,        // Final text on the player badge
                                                difficulty = null,
                                                moves = null,
                                                maxHeightPx,
                                                accentColor = '#FACC15', // Heading accent color
                                            }) {
    const contentRef = useRef(null);

    const scale = useInfoPanelScale(contentRef, maxHeightPx, [
        kind,
        winnerLabel,
        difficulty,
        moves,
    ]);

    const badgeSize = useInfoPanelBadgeSize(maxHeightPx);

    const card = {
        boxSizing: 'border-box',
        borderRadius: 'clamp(20px, 3vw, 40px)',
        background: 'linear-gradient(180deg, #1B263B 0%, #0F172A 100%)',
        color: colors?.text || '#E2E8F0',
        filter: 'drop-shadow(-2px 4px 6px rgba(120,160,255,0.3))',
        padding: 'clamp(18px, 2.8vw, 24px)',
        position: 'relative',
        zIndex: 1,
        maxHeight: maxHeightPx ? `${maxHeightPx}px` : undefined,
        overflow: 'hidden',
    };

    const contentWrap = {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        maxWidth: '100%',
    };

    const title = {
        ...styles?.subtitleStyle,
        margin: 0,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 900,
        fontSize: 'clamp(28px, 4vw, 52px)',
        lineHeight: 1.15,
        textAlign: 'center',
        color: accentColor,
    };

    const winnerWrap = {
        marginTop: 'clamp(12px, 1.8vw, 18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const grid = {
        marginTop: 'clamp(12px, 2.4vw, 24px)',
        display: 'grid',
        gridTemplateColumns: 'auto auto',
        columnGap: 'clamp(12px, 2.8vw, 22px)',
        rowGap: 'clamp(10px, 2.2vw, 18px)',
        alignItems: 'center',
        justifyContent: 'center',   // Center the whole two-column block
        maxWidth: '100%',
    };

    const label = {
        fontWeight: 600,
        fontSize: 'clamp(16px, 2.2vw, 24px)',
        lineHeight: 1.2,
        textAlign: 'right',
        justifySelf: 'end',
        color: '#C7D2FE',
    };

    const valueStrong = {
        fontWeight: 800,
        fontSize: 'clamp(18px, 2.4vw, 26px)',
        lineHeight: 1.2,
        color: '#FFFFFF',
        textAlign: 'center',
        justifySelf: 'center',
    };

    const difficultyLabel = (() => {
        if (difficulty == null) return '—';
        if (typeof difficulty === 'string') return cap(difficulty);
        if (typeof difficulty === 'object') {
            const raw =
                    difficulty.level ??
                    difficulty.difficulty ??
                    difficulty.name ??
                    '';
            return raw ? cap(String(raw)) : '—';
        }
        return cap(String(difficulty));
    })();

    function cap(s) {
        const t = String(s).replace(/_/g, ' ');
        return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
    }

    return (
            <Box style={card}>
                <div ref={contentRef} style={contentWrap}>
                    <h3 style={title}>Winner</h3>

                    <div style={winnerWrap}>
                        <PlayerBadge
                                kind={kind}
                                label={winnerLabel}
                                size={badgeSize}
                        />
                    </div>

                    <div style={grid}>
                        <div style={label}>Difficulty:</div>
                        <div style={valueStrong}>{difficultyLabel}</div>

                        <div style={label}>Moves:</div>
                        <div style={valueStrong}>
                            {Number.isFinite(moves) ? moves : '—'}
                        </div>
                    </div>
                </div>
            </Box>
    );
}
