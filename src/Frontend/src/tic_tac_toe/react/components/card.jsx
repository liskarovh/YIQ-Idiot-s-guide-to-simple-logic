import React from 'react';
import colors from '../../../Colors';

export default function Card({ title, children, style, bodyStyle }) {
  const c = colors || {};
  return (
    <div
      style={{
        position: 'relative',
        background: c.secondary || '#0F172A',
        borderRadius: 40,
        boxShadow: '-2px 4px 14px rgba(255,255,255,0.15) inset, 0 6px 18px rgba(0,0,0,0.35)',
        padding: 24,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontWeight: 800,
            fontSize: 26,
            lineHeight: '32px',
            color: c.textPrimary || '#CBD5E1',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          color: c.textPrimary || '#CBD5E1',
          fontSize: 18,
          lineHeight: '28px',
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
