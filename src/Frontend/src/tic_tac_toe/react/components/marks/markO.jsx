import React from 'react';

export default function MarkO({ size, color = '#5AD3FF', style }) {
  const dim = size ? { width: size, height: size } : {};
  const s = 64; const w = 7; const r = 22;
  return (
    <svg viewBox={`0 0 ${s} ${s}`} style={{ display: 'block', ...dim, ...style }} aria-hidden="true">
      <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={color} strokeWidth={w} />
    </svg>
  );
}
