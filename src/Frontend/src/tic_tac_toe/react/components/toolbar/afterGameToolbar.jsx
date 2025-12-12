/**
 * @file    afterGameToolbar.jsx
 * @brief   Toolbar displayed after a finished game (play again, new game, strategy, back).
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';
import { RestartIcon, NewGameIcon, InfoIcon, BackIcon } from '../icons';
import {
    toolbarWrap,
    toolbarItem,
    toolbarLabel,
    toolbarButton,
    toolbarIcon,
} from './toolbarLayout';

/**
 * AfterGameToolbar
 * Toolbar with actions available after a game ends: back, play again, new game, and strategy.
 */
export default function AfterGameToolbar({
                                             onPlayAgain,
                                             onNewGame,
                                             onStrategy,
                                             onBack,
                                         }) {
    const handleBack = (e) => {
        if (typeof onBack === 'function') {
            onBack(e);
        }
    };

    const handleNewGame = (e) => {
        if (typeof onNewGame === 'function') {
            onNewGame(e);
        }
    };

    const handleStrategy = (e) => {
        if (typeof onStrategy === 'function') {
            onStrategy(e);
        }
    };

    return (
            <div style={toolbarWrap} data-toolbar>
                {/* Back */}
                <div style={toolbarItem}>
                    <button
                            style={toolbarButton}
                            onClick={handleBack}
                            aria-label="Back"
                            title="Back"
                    >
                        <BackIcon style={toolbarIcon} />
                    </button>
                    <div style={toolbarLabel}>Back</div>
                </div>

                {/* Play again = Restart / Play Again */}
                <div style={toolbarItem}>
                    <button
                            style={toolbarButton}
                            onClick={onPlayAgain}
                            aria-label="Play again"
                            title="Play again"
                    >
                        <RestartIcon style={toolbarIcon} />
                    </button>
                    <div style={toolbarLabel}>Play again</div>
                </div>

                {/* New game */}
                <div style={toolbarItem}>
                    <button
                            style={toolbarButton}
                            onClick={handleNewGame}
                            aria-label="New game"
                            title="New game"
                    >
                        <NewGameIcon style={{ ...toolbarIcon, color: '#fff' }} />
                    </button>
                    <div style={toolbarLabel}>New game</div>
                </div>

                {/* Strategy */}
                <div style={toolbarItem}>
                    <button
                            style={toolbarButton}
                            onClick={handleStrategy}
                            aria-label="Strategy"
                            title="Strategy"
                    >
                        <InfoIcon style={toolbarIcon} />
                    </button>
                    <div style={toolbarLabel}>Strategy</div>
                </div>
            </div>
    );
}
