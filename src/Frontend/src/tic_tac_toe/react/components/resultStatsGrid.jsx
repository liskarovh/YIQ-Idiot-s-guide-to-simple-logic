/**
 * @file    resultStatsGrid.jsx
 * @brief   Shared stats grid for result Tic-Tac-Toe panels.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';

/**
 * Shared stats grid for result panels (Draw, Lose, Time ran out, ...).
 *
 * Props:
 *  - size: board size (number | null)
 *  - kToWin: goal (number | null)
 *  - moves: number of moves (number | null)
 *  - hintsUsed: number of hints (number | null)
 *  - labelColor?: override for label text color
 *  - valueColor?: override for value text color
 */
export default function ResultStatsGrid({
                                            size,
                                            kToWin,
                                            moves,
                                            hintsUsed,
                                            labelColor = '#C7D2FE',
                                            valueColor = '#FFFFFF',
                                        }) {
    const grid = {
        marginTop: 'clamp(8px, 2.2vw, 20px)',
        display: 'grid',
        // Two auto-width columns centered; the gap is aligned with the panel axis
        gridTemplateColumns: 'auto auto',
        justifyContent: 'center',
        columnGap: 'clamp(12px, 2.8vw, 22px)',
        rowGap: 'clamp(10px, 2.2vw, 18px)',
        alignItems: 'center',
        maxWidth: '100%',
    };

    const label = {
        fontWeight: 600,
        fontSize: 'clamp(16px, 2.2vw, 24px)',
        lineHeight: 1.2,
        textAlign: 'right',
        justifySelf: 'end',
        color: labelColor,
    };

    const valueStrong = {
        fontWeight: 800,
        fontSize: 'clamp(18px, 2.4vw, 26px)',
        lineHeight: 1.2,
        color: valueColor,
        textAlign: 'center',
        justifySelf: 'center',
    };

    return (
            <div style={grid}>
                <div style={label}>Board size:</div>
                <div
                        style={{
                            justifySelf: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                >
                    <div style={valueStrong}>{size ?? '—'}</div>
                    <div
                            style={{
                                width: 'clamp(18px, 3.4vw, 45px)',
                                textAlign: 'center',
                            }}
                    >
                        ×
                    </div>
                    <div style={valueStrong}>{size ?? '—'}</div>
                </div>

                <div style={label}>Goal:</div>
                <div style={valueStrong}>
                    {Number.isFinite(kToWin) ? kToWin : '—'}
                </div>

                <div style={label}>Moves:</div>
                <div style={valueStrong}>
                    {Number.isFinite(moves) ? moves : '—'}
                </div>

                <div style={label}>Hints used:</div>
                <div style={valueStrong}>
                    {Number.isFinite(hintsUsed) ? hintsUsed : 0}
                </div>
            </div>
    );
}
