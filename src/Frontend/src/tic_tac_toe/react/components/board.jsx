import React, { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import MarkX from './marks/markX.jsx';
import MarkO from './marks/markO.jsx';

const GRID_COLOR = 'rgba(203, 213, 225, 0.85)'; // #CBD5E1

/**
 * Props:
 *  - board: string[][]  // '.', 'X', 'O'
 *  - size: number
 *  - disabled?: boolean
 *  - pendingMove?: { row:number, col:number, mark?:'X'|'O' }
 *  - winnerLine?: Array<[number, number]> | Array<{row:number,col:number}>
 *  - winnerMark?: 'X'|'O'|null       // pro barvu strike čáry
 *  - showStrike?: boolean            // výchozí true
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

  // ── normalize winner sequence: přijmi jak [[r,c],...] tak [{row,col},...] ──
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

  // ── STRIKE LINE overlay ──
  const containerRef = useRef(null);
  const [line, setLine] = useState(null); // {x1,y1,x2,y2}
  const strikeColor = winnerMark === 'O' ? '#38BDF8' : '#FF6B6B'; // O=cyan, X=coral

  // jemné zvýraznění buněk podle vítěze (mírné!)
  const winCell = useMemo(() => {
      const isO = String(winnerMark || '').toUpperCase() === 'O';
      return {
        bgStrong: isO ? 'rgba(56,189,248,0.30)' : 'rgba(255,107,107,0.30)',  // silné jádro
        bgSoft:   isO ? 'rgba(56,189,248,0.18)' : 'rgba(255,107,107,0.18)',  // měkčí okraj
        glow:     isO ? '0 0 12px rgba(56,189,248,0.30)' : '0 0 12px rgba(255,107,107,0.30)',
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

    // Reflow / resize: přepočet
    const ro = typeof ResizeObserver !== 'undefined'
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
        border: `1px solid ${GRID_COLOR}`, // vnější border
        borderRadius: 6,
        overflow: 'hidden',                // nic nepřetéká
        background: 'transparent',
        pointerEvents: 'auto',
        zIndex: 3,
      }}
    >
      {/* --- GRID OVERLAY (místo borderů na buňkách) --- */}
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

      {/* --- CELLS --- */}
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
              aria-label={`cell ${r + 1},${c + 1}${val !== '.' ? ` ${val}` : ''}`}
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
                zIndex: 2, // nad overlayem mřížky
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

      {/* --- STRIKE LINE SVG OVERLAY --- */}
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
              {/* mírně silnější glow: 6 → 7 */}
              <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor={strikeColor} floodOpacity="0.9" />
            </filter>
          </defs>
          <line
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke={strikeColor}
            strokeWidth={10}          // 8 → 10 (mírné zesílení)
            strokeLinecap="round"
            filter="url(#win-glow)"
          />
        </svg>
      )}
    </div>
  );
}

export default memo(Board);
