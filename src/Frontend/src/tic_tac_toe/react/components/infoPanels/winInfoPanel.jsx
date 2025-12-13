/**
 * @file    winInfoPanel.jsx
 * @brief   React info panel shown when the local player wins the game.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { useRef } from 'react';
import Box from '../../../../components/Box';
import styles from '../../../../Styles';
import PlayerBadge from '../playerBadge.jsx';
import {
    useInfoPanelScale,
    useInfoPanelBadgeSize,
} from '../../hooks/useInfoPanelLayout';
import ResultStatsGrid from '../resultStatsGrid.jsx';

/**
 * WinInfoPanel
 * Victory info panel for the local player
 */
export default function WinInfoPanel({
                                         players,
                                         kToWin,
                                         size,
                                         maxHeightPx,
                                         moves = null,
                                         hintsUsed = null,
                                     }) {
    const contentRef = useRef(null);

    // Shared scaling behavior
    const scale = useInfoPanelScale(contentRef, maxHeightPx, [
        players,
        kToWin,
        size,
        moves,
        hintsUsed,
    ]);

    // Shared badge size behavior for info panels
    const badgeSize = useInfoPanelBadgeSize(maxHeightPx);

    const card = {
        boxSizing: 'border-box',
        borderRadius: 'clamp(20px, 3vw, 40px)',
        background: 'linear-gradient(180deg, #052E25 0%, #0F172A 100%)',
        color: '#E6FFF5',
        filter: 'drop-shadow(-2px 4px 6px rgba(0,255,170,0.25))',
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
        color: '#00E6A8',
    };

    const subtitle = {
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
        color: '#D1FAE5',
    };

    return (
            <Box style={card}>
                <div ref={contentRef} style={contentWrap}>
                    <h3 style={title}>You win!</h3>
                    <div style={subtitle}>Nicely played — gg 🎉</div>

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
                            labelColor="#A7F3D0"
                            valueColor="#FFFFFF"
                    />
                </div>
            </Box>
    );
}
