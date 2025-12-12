/**
 * @file    xWinInfoPanel.jsx
 * @brief   React info panel shown when player X wins the game in spectator.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';
import WinnerInfoPanelBase from './base/winnerInfoPanelBase.jsx';

/**
 * XWinInfoPanel
 * Convenience wrapper around WinnerInfoPanelBase for the X player victory case.
 */
export default function XWinInfoPanel({
                                          players,
                                          difficulty = null,
                                          moves = null,
                                          maxHeightPx,
                                      }) {
    const winnerLabel = players?.x || 'Player X';

    return (
            <WinnerInfoPanelBase
                    kind="X"
                    winnerLabel={winnerLabel}
                    difficulty={difficulty}
                    moves={moves}
                    maxHeightPx={maxHeightPx}
                    accentColor="#FACC15"
            />
    );
}
