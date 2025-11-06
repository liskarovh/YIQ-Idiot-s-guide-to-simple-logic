// src/Frontend/src/react/react/components/bestMoveHint.jsx
import React from 'react';

export default function BestMoveHint({
  containerRef,  // nemusíme na něj sahat – pozicujeme procenty v rámci boardu
  size,
  move,          // [row, col]
  show,
  cellInset = 2, // px od okrajů buňky
  mark = 'X',    // volitelné: 'X' | 'O' (můžeme barvit dle hráče na tahu)
}) {
  if (!show || !Array.isArray(move) || size <= 0) return null;

  const [r, c] = move;
  const cellPct = 100 / size;

  const boxStyle = {
    position: 'absolute',
    left:  `calc(${c * cellPct}% + ${cellInset}px)`,
    top:   `calc(${r * cellPct}% + ${cellInset}px)`,
    width: `calc(${cellPct}% - ${2 * cellInset}px)`,
    height:`calc(${cellPct}% - ${2 * cellInset}px)`,
    pointerEvents: 'none',
    zIndex: 5,
  };

  const isO = String(mark).toUpperCase() === 'O';

  return (
    <div aria-label="best-move-hint" style={boxStyle}>
      {/* pozadí pro jemný glow */}
      <div style={{
        position:'absolute', inset:0, borderRadius:8,
        boxShadow:'0 0 18px rgba(34,197,94,0.8), 0 0 32px rgba(34,197,94,0.35)',
        opacity:0.9
      }} />
      {/* vlastní znak */}
      {isO ? (
        <svg viewBox="0 0 64 64" style={{ position:'absolute', inset:'12%', filter:'drop-shadow(0 0 8px rgba(34,197,94,0.9))' }}>
          <circle cx="32" cy="32" r="20" stroke="#22C55E" strokeWidth="8" fill="none"/>
        </svg>
      ) : (
        <>
          <div style={{
            position:'absolute', left:'50%', top:'50%', width:'72%', height:6,
            transform:'translate(-50%,-50%) rotate(45deg)',
            background:'#22C55E', borderRadius:4, boxShadow:'0 0 14px rgba(34,197,94,0.9)'
          }}/>
          <div style={{
            position:'absolute', left:'50%', top:'50%', width:'72%', height:6,
            transform:'translate(-50%,-50%) rotate(-45deg)',
            background:'#22C55E', borderRadius:4, boxShadow:'0 0 14px rgba(34,197,94,0.9)'
          }}/>
        </>
      )}
    </div>
  );
}
