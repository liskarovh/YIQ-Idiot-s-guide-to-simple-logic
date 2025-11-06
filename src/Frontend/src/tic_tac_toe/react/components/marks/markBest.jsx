import React from 'react';
import colors from '../../../../Colors';

export default function MarkBest({ size, color = colors.win, style }) {
  // pokud je předán style.width/height, respektujeme je; jinak size
  const dim = size ? { width: size, height: size } : {};
  const s = 64;         // viewBox size
  const w = 12;         // stroke width (tlustší než MarkX)
  const p = 12;         // padding od okraje

  return (
    <svg
      viewBox={`0 0 ${s} ${s}`}
      style={{ display: 'block', ...dim, ...style }}
      aria-hidden="true"
    >
      <line x1={p} y1={p} x2={s - p} y2={s - p} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <line x1={s - p} y1={p} x2={p} y2={s - p} stroke={color} strokeWidth={w} strokeLinecap="round" />
    </svg>
  );
}
