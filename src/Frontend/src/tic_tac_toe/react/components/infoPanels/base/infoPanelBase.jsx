/**
 * @file    infoPanelBase.jsx
 * @brief   Helper for shared styling of info panels.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import styles from '../../../../../Styles';
import colors from '../../../../../Colors';

/**
 * Shared visual for info panels:
 * - outer card
 * - scaled content wrapper
 * - title style
 *
 * @param {number} scale        Calculated scale factor for the content.
 * @param {?number} maxHeightPx Optional maximum height of the panel in pixels.
 * @returns {{card: object, contentWrap: object, titleStyle: object}} Style objects.
 */
export function makeStandardInfoPanel(scale, maxHeightPx) {
    const card = {
        boxSizing: 'border-box',
        borderRadius: 'clamp(20px, 3vw, 40px)',
        background: '#0F172A',
        color: colors?.text || '#CBD5E1',
        filter: 'drop-shadow(-2px 4px 4px rgba(255,255,255,0.25))',
        padding: 'clamp(18px, 2.8vw, 24px)',
        position: 'relative',
        zIndex: 1,
        maxHeight: maxHeightPx ? `${maxHeightPx}px` : undefined,
        overflow: 'hidden',
    };

    const contentWrap = {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        maxWidth: '100%',
    };

    const titleStyle = {
        ...styles?.subtitleStyle,
        margin: 0,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: 'clamp(26px, 3.6vw, 45px)',
        lineHeight: 1.2,
        textAlign: 'center',
        color: colors?.text || '#CBD5E1',
    };

    return { card, contentWrap, titleStyle };
}
