import React from 'react';
import colors from '../Colors';

/**
 * SettingsCard — dark rounded panel with a heading.
 *
 * Renders a stylized container with default visual settings (background, border,
 * shadow, padding, and text color) and merges any provided `style` prop on top.
 * If `title` is provided, it will be rendered as a centered `<h3>`.
 *
 * @param {string} [title] - Optional title text.
 * @param {import('react').ReactNode} children - Inner content.
 * @param {Object} [style={}] - Style overrides merged into wrapper styles.
 *
 * @returns {JSX.Element} The rendered settings card component.
 */
function SettingsCard({ title, children, style = {} }) {
    const wrap = {
        background: 'rgba(2,6,23,0.7)',
        borderRadius: 22,
        border: '1px solid rgba(255,255,255,0.25)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15), -8px 6px 10px rgba(255,255,255,0.08)',
        padding: '22px 26px',
        color: colors.text,
        ...style,
    };
    const h = {
        margin: 0,
        marginBottom: 40,
        color: colors.text,
        fontWeight: 800,
        fontSize: 45,
        textAlign: 'center',
    };
    return (
            <div style={wrap}>
                {title && <h3 style={h}>{title}</h3>}
                {children}
            </div>
    );
}

export default SettingsCard;

