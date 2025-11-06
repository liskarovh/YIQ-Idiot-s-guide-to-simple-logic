// src/Frontend/src/react/react/components/gameInfoPanel.jsx
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import Box from '../../../../components/Box';
import styles from '../../../../Styles';
import colors from '../../../../Colors';
import PlayerBadge from '../playerBadge.jsx';
import ConnectOptions from '../connectOptions.jsx';

export default function GameInfoPanel({
  players, mode, kToWin, size, timeDisplay, maxHeightPx,
  TurnGlyph, player = 'X', difficulty = null,
}) {
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Jemné zmenšení obsahu, aby se vešel na výšku panelu (bez vnitřního scrollu)
  useLayoutEffect(() => {
    if (!maxHeightPx) { setScale(1); return; }
    const el = contentRef.current; if (!el) return;
    const prev = el.style.transform;
    el.style.transform = 'none';
    const natural = el.scrollHeight || 1;
    const target  = Math.max(0, maxHeightPx - 2);
    el.style.transform = prev;
    const s = Math.min(1, target / natural);
    setScale(s > 0.98 ? 1 : s);
  }, [maxHeightPx, players, mode, kToWin, size, timeDisplay, player, difficulty]);

  // === NOVĚ: velikost PlayerBadge dle okna i výšky panelu ===
  // - spodní mez: 48px (čitelné)
  // - horní mez: 110px (vizuálně akorát)
  // - fluidně podle kratší strany okna (12vmin)
  // - a zároveň „strop“ podle výšky panelu (cca 32 %)
  const badgeSize = useMemo(() => {
    const lower = 40;
    const upper = 96;
    if (Number.isFinite(maxHeightPx) && maxHeightPx > 0) {
      const capByPanel = Math.max(lower, Math.floor(maxHeightPx * 0.28));
      return `clamp(${lower}px, min(10vmin, ${capByPanel}px), ${upper}px)`;
    }
    return `clamp(${lower}px, 10vmin, ${upper}px)`;
  }, [maxHeightPx]);

  // --- styly ---
  const card = {
    boxSizing: 'border-box',
    borderRadius: 'clamp(20px, 3vw, 40px)',
    background: '#0F172A',
    color: colors?.text || '#CBD5E1',
    filter: 'drop-shadow(-2px 4px 4px rgba(255,255,255,0.25))',
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

  const infoTitle   = { ...styles?.subtitleStyle, margin: 0, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 'clamp(26px, 3.6vw, 45px)', lineHeight: 1.2, textAlign: 'center', color: colors?.text || '#CBD5E1' };
  const duo         = { marginTop: 'clamp(10px, 1.6vw, 16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px, 2.2vw, 22px)' };
  const vsText      = { fontWeight: 700, fontSize: 'clamp(22px, 3.2vw, 45px)', lineHeight: 1.2, color: colors?.text || '#CBD5E1' };

  const grid = {
    marginTop: 'clamp(8px, 2.2vw, 20px)',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    columnGap: 'clamp(12px, 2.8vw, 22px)',
    rowGap: 'clamp(10px, 2.2vw, 18px)',
    alignItems: 'center',
    justifyContent: 'start',
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

  const timeValue = {
    fontWeight: 800,
    fontSize: 'clamp(16px, 2.2vw, 24px)',
    lineHeight: 1.2,
    color: '#2DC12D',
    textAlign: 'center',
    justifySelf: 'center',
  };

  const difficultyLabel = (() => {
    if (difficulty == null) return '—';
    if (typeof difficulty === 'string') return cap(difficulty);
    if (typeof difficulty === 'object') {
      const raw = difficulty.level ?? difficulty.difficulty ?? difficulty.name ?? '';
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
        <h3 style={infoTitle}>Game info</h3>

        <div style={duo}>
          <PlayerBadge kind="X" label={players?.x || (mode === 'pve' ? 'Player' : 'Player1')} size={badgeSize} />
          <div style={vsText}>VS</div>
          <PlayerBadge kind="O" label={players?.o || (mode === 'pve' ? 'Computer' : 'Player2')} size={badgeSize} />
        </div>

        <div style={grid}>
          <div style={label}>Turn:</div>
          <div style={{ justifySelf: 'center', display: 'grid', placeItems: 'center' }}>
            <TurnGlyph who={player} />
          </div>

          <div style={label}>Time remaining:</div>
          <div style={timeValue}>{timeDisplay}</div>

          <div style={label}>Goal:</div>
          <div style={valueStrong}>{Number.isFinite(kToWin) ? kToWin : '—'}</div>

          {mode === 'pve' && (
            <>
              <div style={label}>Difficulty:</div>
              <div style={valueStrong}>{difficultyLabel}</div>
            </>
          )}

          <div style={label}>Board size:</div>
          <div style={{ justifySelf: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={valueStrong}>{size}</div>
            <div style={{ width: 'clamp(18px, 3.4vw, 45px)', textAlign: 'center' }}>×</div>
            <div style={valueStrong}>{size}</div>
          </div>

          <div style={label}>Connecting options:</div>
          <div style={{ justifySelf: 'center', display: 'grid', placeItems: 'center' }}>
            <ConnectOptions />
          </div>
        </div>
      </div>
    </Box>
  );
}
