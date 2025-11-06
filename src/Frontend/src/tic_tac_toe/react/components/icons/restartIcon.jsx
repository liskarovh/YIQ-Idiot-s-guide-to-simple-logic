import React from 'react';
import src from '../../../../assets/tic_tac_toe/restart.svg';
export default function RestartIcon({ size, className, style }) {
  const dim = size ? { width: size, height: size } : {};
  return <img src={src} alt="" aria-hidden="true" className={className} style={{ display:'block', ...dim, ...style }} />;
}
