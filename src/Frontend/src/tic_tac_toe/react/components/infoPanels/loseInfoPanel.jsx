/**
 * @file    loseInfoPanel.jsx
 * @brief   React info panel shown when the local player loses the game.
 *
 * @author  Hana Liškařová <xliskah00@stud.fit.vutbr.cz>
 * @date    2025-12-12
 */

import React from 'react';
import DefeatInfoPanelBase from './base/defeatInfoPanelBase.jsx';

/**
 * LoseInfoPanel
 * Thin wrapper around DefeatInfoPanelBase for the defeat case.
 */
export default function LoseInfoPanel(props) {
    return (
            <DefeatInfoPanelBase
                    {...props}
                    title="You lose"
            />
    );
}
