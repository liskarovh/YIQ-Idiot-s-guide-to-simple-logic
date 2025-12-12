/**
 * @file    DefeatInfoPanelBase.jsx
 * @brief   Base React info panel used to display defeat state and post-game stats.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { useRef } from 'react';
import Box from '../../../../../components/Box';
import styles from '../../../../../Styles';
import PlayerBadge from '../../playerBadge.jsx';
import {
    useInfoPanelScale,
    useInfoPanelBadgeSize,
} from '../../../hooks/useInfoPanelLayout';
import ResultStatsGrid from '../../resultStatsGrid.jsx';

/**
 * DefeatInfoPanelBase
 * Generic defeat panel that can be reused
 */
export default function DefeatInfoPanelBase({
                                                title,
                                                subtitle,          // optional subtitle text or undefined
                                                players,
                                                kToWin,
                                                size,
                                                maxHeightPx,
                                                moves = null,
                                                hintsUsed = null,
                                            }) {
    const contentRef = useRef(null);

    const scale = useInfoPanelScale(contentRef, maxHeightPx, [
        players,
        kToWin,
        size,
        moves,
        hintsUsed,
        title,
        subtitle,
    ]);

    const badgeSize = useInfoPanelBadgeSize(maxHeightPx);

    const card = {
        boxSizing: 'border-box',
        borderRadius: 'clamp(20px, 3vw, 40px)',
        background: 'linear-gradient(180deg, #2A0F0F 0%, #0F172A 100%)',
        color: '#FFE6E6',
        filter: 'drop-shadow(-2px 4px 6px rgba(255,80,80,0.25))',
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

    const titleStyle = {
        ...styles?.subtitleStyle,
        margin: 0,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 900,
        fontSize: 'clamp(28px, 4vw, 52px)',
        lineHeight: 1.15,
        textAlign: 'center',
        color: '#FF6B6B',
    };

    const subtitleStyle = {
        margin: '6px 0 0',
        textAlign: 'center',
        opacity: 0.9,
    };

    const duo = {
        marginTop: 'clamp(12px, 1.8vw, 18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(8px, 2.2vw, 22px)',
    };

    const vsText = {
        fontWeight: 900,
        fontSize: 'clamp(22px, 3.2vw, 42px)',
        lineHeight: 1.2,
        color: '#FFD1D1',
    };

    return (
            <Box style={card}>
                <div ref={contentRef} style={contentWrap}>
                    <h3 style={titleStyle}>{title}</h3>
                    {subtitle && <div style={subtitleStyle}>{subtitle}</div>}

                    <div style={duo}>
                        <PlayerBadge
                                kind="X"
                                label={players?.x || 'Player'}
                                size={badgeSize}
                        />
                        <div style={vsText}>VS</div>
                        <PlayerBadge
                                kind="O"
                                label={players?.o || 'Computer'}
                                size={badgeSize}
                        />
                    </div>

                    <ResultStatsGrid
                            size={size}
                            kToWin={kToWin}
                            moves={moves}
                            hintsUsed={hintsUsed}
                            labelColor="#FFC2C2"
                            valueColor="#FFFFFF"
                    />
                </div>
            </Box>
    );
}
