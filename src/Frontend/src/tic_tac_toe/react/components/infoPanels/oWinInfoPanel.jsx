/**
 * @file    oWinInfoPanel.jsx
 * @brief   Info panel shown when player O wins the game in spectator.
 *
 * @author  Hana Liškařová <xliskah00@stud.fit.vutbr.cz>
 * @date    2025-12-12
 */

import React from 'react';
import WinnerInfoPanelBase from './base/winnerInfoPanelBase.jsx';

/**
 * OWinInfoPanel
 * Convenience wrapper around WinnerInfoPanelBase for the O player victory case.
 */
export default function OWinInfoPanel({
                                          players,
                                          difficulty = null,
                                          moves = null,
                                          maxHeightPx,
                                      }) {
    const winnerLabel = players?.o || 'Player O';

    return (
            <WinnerInfoPanelBase
                    kind="O"
                    winnerLabel={winnerLabel}
                    difficulty={difficulty}
                    moves={moves}
                    maxHeightPx={maxHeightPx}
                    accentColor="#FACC15"
            />
    );
}
