import React from 'react';
import colors from '../Colors';

/**
 * PlayButton — large button with a play icon.
 *
 * Renders a rounded pill-style button with an inline play icon on the left and
 * a label on the right. Visual styling (background, border, shadow, typography)
 * comes from inline style objects. Hover interactions update the element's
 * `transform` and `boxShadow` styles to create a subtle lift effect.
 *
 * @param {import('react').ReactNode} [children='Play'] - Button label/content.
 * @param {() => void} [onClick] - Click handler.
 *
 * @returns {JSX.Element} The rendered PlayButton component.
 */
function PlayButton({ children = 'Play', onClick }) {
    const btn = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 26px',
        borderRadius: 999,
        background: 'rgba(148,163,184,0.18)',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: '-8px 6px 10px rgba(255,255,255,0.15), inset 0 0 0 1px rgba(255,255,255,0.15)',
        color: colors.text_header,
        fontWeight: 800,
        fontSize: 28,
        cursor: 'pointer',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
    };
    const playIcon = (
            <div style={{
                width: 34, height: 34, borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                background: 'rgba(255,255,255,0.15)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)',
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5l12 7-12 7z" />
                </svg>
            </div>
    );
    const hover = (e, up) => {
        e.currentTarget.style.transform = up ? 'translateY(-2px)' : 'translateY(0)';
        e.currentTarget.style.boxShadow = up
                                          ? '-8px 10px 16px rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.2)'
                                          : '-8px 6px 10px rgba(255,255,255,0.15), inset 0 0 0 1px rgba(255,255,255,0.15)';
    };
    return (
            <button
                    style={btn}
                    onClick={onClick}
                    onMouseEnter={(e) => hover(e, true)}
                    onMouseLeave={(e) => hover(e, false)}
            >
                {playIcon}
                {children}
            </button>
    );
}

export default PlayButton;
