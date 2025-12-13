/**
 * @file    settingsToolbar.jsx
 * @brief   Bottom toolbar for GameSettingsPage (Play / Spectate / Back).
 *
 * Uses BoxButton for all buttons and responsive spacing/sizing.
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';
import BackIcon from '../icons/backIcon.jsx';
import NewGameIcon from '../icons/newGameIcon.jsx';
import BoxButton from '../../../../components/BoxButton.jsx';

export default function SettingsToolbar({
                                            style,
                                            primaryStyle,
                                            secondaryStyle,
                                            onPlay,
                                            onSpectate,
                                            onBack,
                                        }) {
    // ===== Layout (outer row) ===============================================
    const row = {
        ...(style || {}),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'clamp(18px, 5vw, 72px)',
        rowGap: 'clamp(14px, 4vw, 40px)',
        padding: 'clamp(6px, 1.5vw, 14px) 0',
    };

    // ===== Button sizing (shared between BoxButtons) =========================
    const btnH = 'clamp(38px, 6vw, 56px)';            // common height for all buttons
    const btnWPrimary = 'clamp(95px, 15vw, 170px)';    // Play button is wider
    const btnWSecondary = 'clamp(85px, 13vw, 150px)';  // Spectate / Back slightly narrower

    // Common style for all BoxButtons
    const btnCommonStyle = {
        fontSize: 'clamp(12px, 1.9vw, 23px)',
        padding: 'clamp(8px, 1.45vmin, 11px) clamp(9px, 1.8vmin, 15px)',
        borderRadius: 'clamp(12px, 2vmin, 19px)',
        gap: 'clamp(6px, 1.2vw, 11px)',
    };

    // Icon size for all icons in this toolbar.
    const iconSize = 'clamp(15px, 2.6vw, 24px)';

    // ===== Render ============================================================
    return (
            <div style={row}>
                {/* Primary action – start a new game with current settings */}
                <BoxButton
                        title="Play"
                        icon={<NewGameIcon size={iconSize} />}
                        onClick={onPlay}
                        disabled={!onPlay}
                        width={btnWPrimary}
                        height={btnH}
                        style={{
                            ...btnCommonStyle,
                            // Explicit width/height as a fallback if BoxButton ignores props.
                            width: btnWPrimary,
                            height: btnH,
                            ...(primaryStyle || {}),
                        }}
                />

                {/* Secondary action – create spectator (AI vs AI) game */}
                <BoxButton
                        title="Spectate"
                        onClick={onSpectate}
                        disabled={!onSpectate}
                        width={btnWSecondary}
                        height={btnH}
                        style={{
                            ...btnCommonStyle,
                            width: btnWSecondary,
                            height: btnH,
                            ...(secondaryStyle || {}),
                        }}
                />

                {/* Navigation – go back to the previous view */}
                <BoxButton
                        title="Back"
                        icon={<BackIcon size={iconSize} />}
                        onClick={onBack}
                        disabled={!onBack}
                        width={btnWSecondary}
                        height={btnH}
                        style={{
                            ...btnCommonStyle,
                            width: btnWSecondary,
                            height: btnH,
                            ...(secondaryStyle || {}),
                        }}
                />
            </div>
    );
}
