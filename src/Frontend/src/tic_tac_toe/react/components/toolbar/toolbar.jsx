/**
 * @file    toolbar.jsx
 * @brief   Main in-game toolbar for Tic-Tac-Toe controls.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';
import colors from '../../../../Colors';
import {
    BestMoveIcon,
    RestartIcon,
    PauseIcon,
    PowerIcon,
    InfoIcon,
    SettingsIcon,
} from '../icons';
import {
    toolbarWrap,
    toolbarItem,
    toolbarLabel,
    toolbarButton,
    toolbarIcon,
} from './toolbarLayout';

export default function Toolbar({
                                    onBestMove,
                                    onRestart,
                                    onPause,
                                    onPower,
                                    onStrategy,
                                    onSettings,
                                    paused = false,
                                    bestMoveActive = false,
                                    isSpectator = false,
                                }) {
    const dimmed = {
        opacity: 0.45,
        filter: 'grayscale(0.2)',
        pointerEvents: 'none',
        cursor: 'default',
    };

    const handleStrategy = (e) => {
        if (typeof onStrategy === 'function') {
            onStrategy(e);
        }
    };

    const handleSettings = (e) => {
        if (typeof onSettings === 'function') {
            onSettings(e);
        }
    };

    return (
            <div style={toolbarWrap}>
                {/* Best move */}
                <div style={toolbarItem}>
                    <button
                            style={{
                                ...toolbarButton,
                                ...((paused || isSpectator) ? dimmed : null),
                                ...(bestMoveActive && !(paused || isSpectator)
                                        ? {
                                            filter:
                                                    'drop-shadow(0 0 8px rgba(45,193,45,0.7))',
                                        }
                                        : null),
                            }}
                            onClick={(paused || isSpectator) ? undefined : onBestMove}
                            aria-label="Best move"
                            aria-disabled={paused || isSpectator}
                            disabled={paused || isSpectator}
                            title={
                                isSpectator
                                        ? 'Best move is not available in spectator mode'
                                        : 'Show best move'
                            }
                    >
                        <BestMoveIcon
                                style={{
                                    ...toolbarIcon,
                                    ...(bestMoveActive && !(paused || isSpectator)
                                            ? { color: colors.win }
                                            : null),
                                }}
                        />
                    </button>
                    <div
                            style={{
                                ...toolbarLabel,
                                ...(bestMoveActive && !(paused || isSpectator)
                                        ? { color: colors.win, opacity: 1 }
                                        : null),
                                ...((paused || isSpectator) ? { opacity: 0.45 } : null),
                            }}
                    >
                        Best move
                    </div>
                </div>

                {/* Restart */}
                <div style={toolbarItem}>
                    <button
                            style={{
                                ...toolbarButton,
                                ...(isSpectator
                                        ? {
                                            opacity: 0.45,
                                            cursor: 'default',
                                            pointerEvents: 'none',
                                        }
                                        : null),
                            }}
                            onClick={isSpectator ? undefined : onRestart}
                            aria-label="Restart"
                            aria-disabled={isSpectator}
                            disabled={isSpectator}
                            title={
                                isSpectator
                                        ? 'Restart is not available in spectator mode'
                                        : 'Restart game'
                            }
                    >
                        <RestartIcon style={toolbarIcon} />
                    </button>
                    <div
                            style={{
                                ...toolbarLabel,
                                ...(isSpectator ? { opacity: 0.45 } : null),
                            }}
                    >
                        Restart
                    </div>
                </div>

                {/* Pause / Resume */}
                <div style={toolbarItem}>
                    <button
                            style={{
                                ...toolbarButton,
                                ...(isSpectator
                                        ? {
                                            opacity: 0.45,
                                            cursor: 'default',
                                            pointerEvents: 'none',
                                        }
                                        : null),
                            }}
                            onClick={isSpectator ? undefined : onPause}
                            aria-label={paused ? 'Resume' : 'Pause'}
                            aria-pressed={isSpectator ? false : paused}
                            aria-disabled={isSpectator}
                            disabled={isSpectator}
                            title={
                                isSpectator
                                        ? 'Pause is not available in spectator mode'
                                        : paused
                                                ? 'Resume'
                                                : 'Pause'
                            }
                    >
                        <PauseIcon style={toolbarIcon} />
                    </button>
                    <div
                            style={{
                                ...toolbarLabel,
                                ...(isSpectator ? { opacity: 0.45 } : null),
                            }}
                    >
                        {paused ? 'Resume' : 'Pause'}
                    </div>
                </div>

                {/* End */}
                <div style={toolbarItem}>
                    <button
                            style={toolbarButton}
                            onClick={onPower}
                            aria-label="End"
                            title="End game"
                    >
                        <PowerIcon style={toolbarIcon} />
                    </button>
                    <div style={toolbarLabel}>End</div>
                </div>

                {/* Strategy */}
                <div style={toolbarItem}>
                    <button
                            style={{ ...toolbarButton, ...(paused ? dimmed : null) }}
                            onClick={handleStrategy}
                            aria-label="Strategy"
                            aria-disabled={paused}
                            disabled={paused}
                            title="Show strategy"
                    >
                        <InfoIcon style={toolbarIcon} />
                    </button>
                    <div
                            style={{
                                ...toolbarLabel,
                                ...(paused ? { opacity: 0.45 } : null),
                            }}
                    >
                        Strategy
                    </div>
                </div>

                {/* Settings */}
                <div style={toolbarItem}>
                    <button
                            style={toolbarButton}
                            onClick={handleSettings}
                            aria-label="Settings"
                            title="Game settings"
                    >
                        <SettingsIcon style={toolbarIcon} />
                    </button>
                    <div style={toolbarLabel}>Settings</div>
                </div>
            </div>
    );
}
