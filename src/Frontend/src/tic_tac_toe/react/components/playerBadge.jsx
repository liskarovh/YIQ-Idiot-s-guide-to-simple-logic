// src/Frontend/src/react/react/components/playerBadge.jsx
import React from 'react';
import colors from '../../../Colors';
import MarkX from './marks/markX.jsx';
import MarkO from './marks/markO.jsx';

export default function PlayerBadge({
  kind = 'X',
  label = 'Player',
  // výchozí: škálování podle viewportu (funguje i bez maxHeightPx)
  size = 'clamp(56px, 12vmin, 110px)',
}) {
  const iconScale = 0.62;
  const dim = typeof size === 'number' ? `${size}px` : size;

  // --- Dynamické škálování textu pro delší jména ---
  const MAX_CH = 10;
  const text = String(label ?? '');
  const charCount = [...text].length;
  const scale = charCount > MAX_CH ? (MAX_CH / charCount) : 1;

  const fontBase = 'clamp(18px, 2.6vw, 30px)';
  const fontSize = `calc(${fontBase} * ${scale})`;

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#D9D9D9',
          display: 'grid',
          placeItems: 'center',
        }}
        aria-hidden="true"
      >
        <div style={{ width: `calc(${dim} * ${iconScale})`, height: `calc(${dim} * ${iconScale})` }}>
          {kind === 'X'
            ? <MarkX color="#FF6B6B" style={{ width: '100%', height: '100%' }} />
            : <MarkO color="#5AD3FF" style={{ width: '100%', height: '100%' }} />}
        </div>
      </div>

      <div
        title={text}
        style={{
          fontWeight: 700,
          fontSize,
          lineHeight: 1.2,
          color: colors?.text || '#CBD5E1',
          width: '10ch',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {text}
      </div>
    </div>
  );
}
