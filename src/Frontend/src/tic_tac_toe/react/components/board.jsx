/**
 * @file    board.jsx
 * @brief   Core Tic-Tac-Toe board component with marks, winner highlight, and strike overlay.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import MarkX from './marks/markX.jsx';
import MarkO from './marks/markO.jsx';
import colors from '../../../Colors';

const GRID_COLOR = colors.text;

/**
 * Board props:
 *  - board: string[][]                 // '.', 'X', 'O'
 *  - size: number                      // board dimension (size x size)
 *  - disabled?: boolean                // disable interactions
 *  - pendingMove?: { row, col, mark }  // ghost preview of the next move
 *  - winnerLine?: Array<[r,c]> | Array<{row,col}>
 *  - winnerMark?: 'X'|'O'|null         // color of the strike line
 *  - showStrike?: boolean              // whether to show the strike line
 *  - onCell?: (r:number, c:number) => void
 */
function Board({
                   board,
                   size,
                   disabled = false,
                   pendingMove = null,
                   winnerLine = null,
                   winnerMark = null,
                   showStrike = true,
                   onCell,
               }) {
    const s = Number(size) || (board?.length ?? 3);

    // Normalize winner sequence to array of {row, col}
    const winnerSeq = useMemo(() => {
        if (!Array.isArray(winnerLine) || winnerLine.length === 0) return [];
        const isPair = Array.isArray(winnerLine[0]);
        return isPair
                ? winnerLine.map(([r, c]) => ({ row: Number(r), col: Number(c) }))
                : winnerLine.map(({ row, col }) => ({ row: Number(row), col: Number(col) }));
    }, [winnerLine]);

    const isInWinner = (r, c) =>
            winnerSeq.length > 0 && winnerSeq.some(({ row, col }) => row === r && col === c);

    const renderMark = (val) => {
        if (val === 'X') return <MarkX style={{ width: '72%', height: '72%' }} />;
        if (val === 'O') return <MarkO style={{ width: '72%', height: '72%' }} />;
        return null;
    };

    const canClick = (r, c) =>
            !disabled && typeof onCell === 'function' && board?.[r]?.[c] === '.';

    // Strike line overlay state
    const containerRef = useRef(null);
    const [line, setLine] = useState(null); // {x1,y1,x2,y2}
    const strikeColor =
            String(winnerMark || '').toUpperCase() === 'O' ? colors.win : colors.lose;

    // Winner cell highlight
    const winCell = useMemo(() => {
        const isO = String(winnerMark || '').toUpperCase() === 'O';
        return isO
                ? {
                    bgStrong: 'rgba(45,193,45,0.30)',
                    bgSoft: 'rgba(45,193,45,0.18)',
                    glow: '0 0 12px rgba(45,193,45,0.30)',
                }
                : {
                    bgStrong: 'rgba(255,33,33,0.30)',
                    bgSoft: 'rgba(255,33,33,0.18)',
                    glow: '0 0 12px rgba(255,33,33,0.30)',
                };
    }, [winnerMark]);

    useLayoutEffect(() => {
        if (!showStrike || winnerSeq.length < 2) {
            setLine(null);
            return;
        }
        const container = containerRef.current;
        if (!container) return;

        const first = winnerSeq[0];
        const last = winnerSeq[winnerSeq.length - 1];

        const qCell = (r, c) =>
                container.querySelector(`[data-cell="1"][data-row="${r}"][data-col="${c}"]`);

        const a = qCell(first.row, first.col);
        const b = qCell(last.row, last.col);
        if (!a || !b) {
            setLine(null);
            return;
        }

        const crect = container.getBoundingClientRect();
        const arect = a.getBoundingClientRect();
        const brect = b.getBoundingClientRect();

        const center = (rect) => ({
            x: rect.left - crect.left + rect.width / 2,
            y: rect.top - crect.top + rect.height / 2,
        });

        const A = center(arect);
        const B = center(brect);
        setLine({ x1: A.x, y1: A.y, x2: B.x, y2: B.y });

        // Reflow / resize handling
        const ro =
                typeof ResizeObserver !== 'undefined'
                        ? new ResizeObserver(() => {
                            const arect2 = a.getBoundingClientRect();
                            const brect2 = b.getBoundingClientRect();
                            const A2 = center(arect2);
                            const B2 = center(brect2);
                            setLine({ x1: A2.x, y1: A2.y, x2: B2.x, y2: B2.y });
                        })
                        : null;

        ro?.observe(container);
        const onWinResize = () => {
            const arect2 = a.getBoundingClientRect();
            const brect2 = b.getBoundingClientRect();
            const A2 = center(arect2);
            const B2 = center(brect2);
            setLine({ x1: A2.x, y1: A2.y, x2: B2.x, y2: B2.y });
        };
        window.addEventListener('resize', onWinResize);

        return () => {
            ro?.disconnect?.();
            window.removeEventListener('resize', onWinResize);
        };
    }, [showStrike, winnerSeq]);

    return (
            <div
                    ref={containerRef}
                    role="grid"
                    aria-label={`Tic-Tac-Toe board ${s} by ${s}`}
                    style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1 / 1',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${s}, 1fr)`,
                        gridTemplateRows: `repeat(${s}, 1fr)`,
                        userSelect: 'none',
                        border: `1px solid ${GRID_COLOR}`,
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: 'transparent',
                        pointerEvents: 'auto',
                        zIndex: 3,
                    }}
            >
                {/* Grid overlay */}
                <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `
            linear-gradient(to right, ${GRID_COLOR} 1px, transparent 1px),
            linear-gradient(to bottom, ${GRID_COLOR} 1px, transparent 1px)
          `,
                            backgroundSize: `calc(100% / ${s}) 100%, 100% calc(100% / ${s})`,
                            backgroundRepeat: 'repeat',
                            backgroundPosition: '0 0, 0 0',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                />

                {/* Cells */}
                {Array.from({ length: s }).map((_, r) =>
                        Array.from({ length: s }).map((__, c) => {
                            const val = board?.[r]?.[c] ?? '.';
                            const isGhost =
                                    pendingMove &&
                                    pendingMove.row === r &&
                                    pendingMove.col === c &&
                                    val === '.';

                            const highlight = isInWinner(r, c);

                            return (
                                    <div
                                            key={`${r}-${c}`}
                                            role="gridcell"
                                            aria-label={`cell ${r + 1},${c + 1}${
                                                    val !== '.' ? ` ${val}` : ''
                                            }`}
                                            data-cell="1"
                                            data-row={r}
                                            data-col={c}
                                            onClick={() => (canClick(r, c) ? onCell(r, c) : null)}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'grid',
                                                placeItems: 'center',
                                                pointerEvents: disabled ? 'none' : 'auto',
                                                cursor: canClick(r, c) ? 'pointer' : 'default',
                                                background: highlight
                                                        ? `radial-gradient(70% 70% at 50% 50%, ${winCell.bgStrong} 0%, ${winCell.bgSoft} 55%, transparent 100%)`
                                                        : 'transparent',
                                                boxShadow: highlight ? winCell.glow : 'none',
                                                position: 'relative',
                                                zIndex: 2,
                                            }}
                                    >
                                        {renderMark(val)}

                                        {isGhost && (
                                                <div
                                                        aria-hidden="true"
                                                        style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                            opacity: 0.35,
                                                            pointerEvents: 'none',
                                                        }}
                                                >
                                                    {pendingMove.mark === 'O' ? (
                                                            <MarkO style={{ width: '72%', height: '72%' }} />
                                                    ) : (
                                                            <MarkX style={{ width: '72%', height: '72%' }} />
                                                    )}
                                                </div>
                                        )}
                                    </div>
                            );
                        })
                )}

                {/* Strike line SVG overlay */}
                {showStrike && winnerSeq.length > 1 && line && (
                        <svg
                                aria-hidden
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none',
                                    overflow: 'visible',
                                    zIndex: 10,
                                }}
                        >
                            <defs>
                                <filter id="win-glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feDropShadow
                                            dx="0"
                                            dy="0"
                                            stdDeviation="7"
                                            floodColor={strikeColor}
                                            floodOpacity="0.9"
                                    />
                                </filter>
                            </defs>
                            <line
                                    x1={line.x1}
                                    y1={line.y1}
                                    x2={line.x2}
                                    y2={line.y2}
                                    stroke={strikeColor}
                                    strokeWidth={10}
                                    strokeLinecap="round"
                                    filter="url(#win-glow)"
                            />
                        </svg>
                )}
            </div>
    );
}

export default memo(Board);
