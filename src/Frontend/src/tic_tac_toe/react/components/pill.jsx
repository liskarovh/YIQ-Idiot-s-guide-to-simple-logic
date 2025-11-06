import React from 'react';
import colors from '../../../Colors';
import styles from '../../../Styles';

export default function Pill({ active = false, onClick, children, style }) {
  const c = colors || {};
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.button,            // pokud máte v Styles.button, použije se
        padding: '13px 28px',
        borderRadius: 40,
        fontWeight: 700,
        fontSize: 18,
        lineHeight: '22px',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(15,23,42,0.35)',
        background: active ? (c.textMuted || '#CBD5E1') : (c.secondary || '#0F172A'),
        color:     active ? (c.secondary || '#0F172A') : (c.headerText || '#FFFFFF'),
        transition: 'transform .12s ease, box-shadow .12s ease',
        ...style,
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(1px)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {children}
    </button>
  );
}
