import React from 'react';
import colors from '../Colors';

/**
 * SettingsOptionButton — pill-style selectable button.
 *
 * Props:
 * - selected: boolean — whether the option is selected.
 * - onClick: () => void — optional click handler.
 * - children: ReactNode — button content.
 */
function SettingsOptionButton({ selected = false, onClick, children }) {
    const backgroundColor = selected ? colors.text_header : colors.text_faded;
    const textColor = selected ? colors.primary : colors.text;

    const base = {
        padding: '8px 14px',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
        background: backgroundColor,
        color: textColor,
        fontWeight: 700,
        fontSize: 32,
        cursor: 'pointer',
        transition: 'transform 120ms ease, box-shadow 120ms ease, background 120ms ease',
  };
  return (
    <button
      type="button"
      style={base}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {children}
    </button>
  );
}

export default SettingsOptionButton;
