/**
 * @file RestartIcon.jsx
 * @brief SVG component for the restart icon used in the Minesweeper game.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React from "react";

export const RestartIcon = ({width = 55.2, height = 64.2}) => (
        <svg xmlns="http://www.w3.org/2000/svg"
             width={width * 0.7}
             height={height * 0.7}
             viewBox="-7.5 0 2.208 2.568"
        >
            <path d="M-5.46 1.015A1.046 1.046 0 0 0-6.586.442l.12-.224a.1.1 0 0 0-.04-.14.1.1 0 0 0-.14.04l-.244.454s-.055.09.03.13l.453.244c.015.01.035.014.05.014.035 0 .075-.02.09-.054a.1.1 0 0 0-.04-.14l-.234-.13c.354-.06.722.12.887.459.2.414.025.912-.389 1.106a.826.826 0 0 1-1.14-1.021.106.106 0 0 0-.066-.135.12.12 0 0 0-.13.075 1.04 1.04 0 0 0 .64 1.325q.171.06.342.06a1.038 1.038 0 0 0 .937-1.49"
                  style={{
                      fill: "#fff",
                      fillOpacity: 1,
                      stroke: "#fff",
                      strokeWidth: 0.124587,
                      strokeOpacity: 1
                  }}
            />
        </svg>
);
