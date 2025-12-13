/**
 * @file    timeRanOutPanel.jsx
 * @brief   Defeat panel shown when the player runs out of time.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React from 'react';
import DefeatInfoPanelBase from './base/defeatInfoPanelBase.jsx';

/**
 * TimeRanOutPanel
 * Thin wrapper around DefeatInfoPanelBase for the time out case.
 */
export default function TimeRanOutPanel(props) {
    return (
            <DefeatInfoPanelBase
                    {...props}
                    title="Time ran out"
                    subtitle="Your turn timer expired."
            />
    );
}
