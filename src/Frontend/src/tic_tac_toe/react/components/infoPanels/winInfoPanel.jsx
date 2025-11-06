// src/Frontend/src/react/react/components/winInfoPanel.jsx
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import Box from '../../../../components/Box';
import styles from '../../../../Styles';
import PlayerBadge from '../playerBadge.jsx';

export default function WinInfoPanel({
  players, kToWin, size, maxHeightPx,
  moves = null, hintsUsed = null,
}) {
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    if (!maxHeightPx) { setScale(1); return; }
    const el = contentRef.current; if (!el) return;
    const prev = el.style.transform;
    el.style.transform = 'none';
    const natural = el.scrollHeight || 1;
    const target  = Math.max(0, maxHeightPx - 2);
    el.style.transform = prev;
    const s = Math.min(1, target / natural);
    setScale(s > 0.985 ? 1 : s);
  }, [maxHeightPx, players, kToWin, size, moves, hintsUsed]);

  const badgeSize = useMemo(() => `clamp(48px, 11vmin, 110px)`, []);

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

  const contentWrap = { transform: `scale(${scale})`, transformOrigin: 'top left', maxWidth: '100%' };

  const title   = { ...styles?.subtitleStyle, margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.15, textAlign: 'center', color: '#00E6A8' };
  const subtitle= { margin: '6px 0 0', textAlign: 'center', opacity: 0.9 };
  const duo     = { marginTop: 'clamp(12px, 1.8vw, 18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px, 2.2vw, 22px)' };
  const vsText  = { fontWeight: 900, fontSize: 'clamp(22px, 3.2vw, 42px)', lineHeight: 1.2, color: '#D1FAE5' };

  const grid = {
    marginTop: 'clamp(12px, 2.4vw, 24px)',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    columnGap: 'clamp(12px, 2.8vw, 22px)',
    rowGap: 'clamp(10px, 2.2vw, 18px)',
    alignItems: 'center',
  };

  const label = { fontWeight: 700, fontSize: 'clamp(14px, 2.0vw, 20px)', textAlign: 'right', justifySelf: 'end', color: '#A7F3D0' };
  const value = { fontWeight: 900, fontSize: 'clamp(18px, 2.4vw, 26px)', textAlign: 'center', color: '#FFFFFF' };

  return (
    <Box style={card}>
      <div ref={contentRef} style={contentWrap}>
        <h3 style={title}>You win!</h3>
        <div style={subtitle}>Nicely played — gg 🎉</div>

        <div style={duo}>
          <PlayerBadge kind="X" label={players?.x || 'Player'} size={badgeSize} />
          <div style={vsText}>VS</div>
          <PlayerBadge kind="O" label={players?.o || 'Computer'} size={badgeSize} />
        </div>

        <div style={grid}>
          <div style={label}>Board</div>
          <div style={value}>{size ?? '—'} × {size ?? '—'}</div>

          <div style={label}>Goal</div>
          <div style={value}>{Number.isFinite(kToWin) ? kToWin : '—'}</div>

          <div style={label}>Moves</div>
          <div style={value}>{Number.isFinite(moves) ? moves : '—'}</div>

          <div style={label}>Hints used</div>
          <div style={value}>{Number.isFinite(hintsUsed) ? hintsUsed : 0}</div>
        </div>
      </div>
    </Box>
  );
}
