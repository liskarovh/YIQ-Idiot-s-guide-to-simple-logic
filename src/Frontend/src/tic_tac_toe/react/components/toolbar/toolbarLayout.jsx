/**
 * @file    toolbarLayout.js
 * @brief   Shared layout styles for Tic-Tac-Toe toolbars.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import colors from '../../../../Colors';

const c = colors || {};

export const toolbarWrap = {
    display: 'grid',
    gridAutoFlow: 'column',
    justifyContent: 'center',
    alignItems: 'end',
    gap: 'clamp(16px, 4vw, 51px)',
    padding: 'clamp(4px, 1vw, 8px) 0',
    color: c.text,
};

export const toolbarItem = {
    display: 'grid',
    justifyItems: 'center',
    gap: '.25rem',
    userSelect: 'none',
};

export const toolbarLabel = {
    fontSize: 'clamp(12px, 2.2vw, 18px)',
    color: c.text,
    opacity: 0.9,
    textAlign: 'center',
    minHeight: '2.4em',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
};

export const toolbarButton = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
};

export const toolbarIcon = {
    width: 'clamp(24px, 4vw, 36px)',
    height: 'clamp(24px, 4vw, 36px)',
};
