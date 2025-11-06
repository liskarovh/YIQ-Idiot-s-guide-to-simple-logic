import React from 'react';

export default function MarkX({ size, color = '#FF6B6B', style }) {
  // pokud je předán style.width/height, respektujeme je; jinak size
  const dim = size ? { width: size, height: size } : {};
  const s = 64; const w = 8; const p = 12;
  return (
    <svg viewBox={`0 0 ${s} ${s}`} style={{ display: 'block', ...dim, ...style }} aria-hidden="true">
      <line x1={p} y1={p} x2={s - p} y2={s - p} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <line x1={s - p} y1={p} x2={p} y2={s - p} stroke={color} strokeWidth={w} strokeLinecap="round" />
    </svg>
  );
}
