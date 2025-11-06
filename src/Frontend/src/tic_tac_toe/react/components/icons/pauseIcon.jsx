import React from 'react';
import src from '../../../../assets/tic_tac_toe/pause.svg';
export default function PauseIcon({ size, className, style }) {
  const dim = size ? { width: size, height: size } : {};
  return <img src={src} alt="" aria-hidden="true" className={className} style={{ display:'block', ...dim, ...style }} />;
}
