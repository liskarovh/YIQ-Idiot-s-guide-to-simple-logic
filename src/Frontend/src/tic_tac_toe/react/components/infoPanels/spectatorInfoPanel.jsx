/**
 * @file    spectatorInfoPanel.jsx
 * @brief   Spectator info panel showing AI vs AI players, board config, last move, and engine stats.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { useMemo, useRef } from 'react';
import Box from '../../../../components/Box';
import colors from '../../../../Colors';
import PlayerBadge from '../playerBadge.jsx';

import {
    useInfoPanelScale,
    useInfoPanelBadgeSize,
} from '../../hooks/useInfoPanelLayout';
import { makeStandardInfoPanel } from './base/infoPanelBase';

export default function SpectatorInfoPanel({
                                               size,
                                               kToWin,
                                               difficulty,
                                               players,
                                               lastMove,     // { player, row, col } | null
                                               explain,      // string | null
                                               explainRich,  // any | null
                                               stats,        // { rollouts?, elapsedMs?, ... }
                                               maxHeightPx,
                                           }) {
    const contentRef = useRef(null);

    const { elapsedMs = null, rollouts = null } = stats || {};

    const scale = useInfoPanelScale(contentRef, maxHeightPx, [
        size,
        kToWin,
        difficulty,
        players,
        lastMove,
        explain,
        explainRich,
        elapsedMs,
        rollouts,
    ]);

    const badgeSize = useInfoPanelBadgeSize(maxHeightPx);

    const { card, contentWrap, titleStyle } = makeStandardInfoPanel(
            scale,
            maxHeightPx,
    );

    const title = titleStyle;

    const sub = {
        marginTop: 10,
        fontWeight: 600,
        fontSize: 'clamp(14px, 2.0vw, 20px)',
    };

    const mono = {
        fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        whiteSpace: 'pre-wrap',
    };

    const duo = {
        marginTop: 'clamp(10px, 1.6vw, 16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(8px, 2.2vw, 22px)',
    };

    const vsText = {
        fontWeight: 700,
        fontSize: 'clamp(22px, 3.2vw, 45px)',
        lineHeight: 1.2,
        color: colors?.text || '#CBD5E1',
    };

    const grid = {
        marginTop: 'clamp(8px, 2.2vw, 20px)',
        display: 'grid',
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
    };

    const valueStrong = {
        fontWeight: 800,
        fontSize: 'clamp(18px, 2.4vw, 26px)',
        lineHeight: 1.2,
        color: '#FFFFFF',
        textAlign: 'center',
        justifySelf: 'center',
    };

    const difficultyLabel = useMemo(() => {
        if (!difficulty) return '—';
        const t = String(difficulty).replace(/_/g, ' ');
        return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
    }, [difficulty]);

    const explanationSummary = useMemo(() => {
        if (
                explainRich &&
                typeof explainRich === 'object' &&
                typeof explainRich.summary === 'string' &&
                explainRich.summary.trim()
        ) {
            return explainRich.summary.trim();
        }

        if (typeof explain === 'string' && explain.trim()) {
            return explain.trim();
        }

        return null;
    }, [explainRich, explain]);

    const hasEngineStats = elapsedMs !== null || rollouts !== null;

    return (
            <Box style={card}>
                <div ref={contentRef} style={contentWrap}>
                    <h3 style={title}>Spectator</h3>

                    <div style={duo}>
                        <PlayerBadge
                                kind="X"
                                label={
                                        players?.X?.nickname ||
                                        players?.x?.nickname ||
                                        'Alpha'
                                }
                                size={badgeSize}
                        />
                        <div style={vsText}>VS</div>
                        <PlayerBadge
                                kind="O"
                                label={
                                        players?.O?.nickname ||
                                        players?.o?.nickname ||
                                        'Beta'
                                }
                                size={badgeSize}
                        />
                    </div>

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

                        <div style={label}>Difficulty:</div>
                        <div style={valueStrong}>{difficultyLabel}</div>
                    </div>

                    {lastMove && (
                            <div style={{ marginTop: 16 }}>
                                <div style={sub}>Last move</div>
                                <div>
                                    Player:{' '}
                                    <b>{String(lastMove.player || '').toUpperCase()}</b>
                                </div>
                                <div>
                                    Cell: r{lastMove.row}, c{lastMove.col}
                                </div>
                            </div>
                    )}

                    {explanationSummary && (
                            <div style={{ marginTop: 16 }}>
                                <div style={sub}>Why this move</div>
                                <div
                                        style={{
                                            marginTop: 4,
                                            fontSize: 'clamp(13px, 1.4vw, 15px)',
                                            lineHeight: 1.4,
                                        }}
                                >
                                    {explanationSummary}
                                </div>
                            </div>
                    )}

                    {hasEngineStats && (
                            <div style={{ marginTop: 16 }}>
                                <div style={sub}>Engine stats</div>
                                <div style={mono}>
                                    {elapsedMs !== null && `elapsedMs: ${elapsedMs}`}
                                    {rollouts !== null && `\nrollouts: ${rollouts}`}
                                </div>
                            </div>
                    )}
                </div>
            </Box>
    );
}
