/**
 * @file StrategyIcon.jsx
 * @brief SVG icon component representing a strategy symbol.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React from "react";

export const StrategyIcon = ({widthHeight = 80}) => (
        <svg xmlns="http://www.w3.org/2000/svg"
             width={widthHeight}
             height={widthHeight}
             fill="none"
             viewBox="0 0 80 80"
        >
            <path d="M39.999 0A40 36.744 0 0 0 0 36.745 40 36.744 0 0 0 9.398 60.41c.117 3.668.247 8.843-1.644 11.183-.663.774-2.048 2.998-2.831 3.635-.561.455-2.258 2.858-1.72 3.94.539 1.083 3.313.846 4.079.718 2.052-.344 4.232-.784 6.196-1.464 2.511-.869 4.707-1.892 7.035-3.172 1.169-.643 3.768-2.404 5.524-4.073a40 36.744 0 0 0 13.962 2.312A40 36.744 0 0 0 80 36.745 40 36.744 0 0 0 39.999 0m-.26 14.361a5.329 5.816 0 0 1 5.327 5.816 5.329 5.816 0 0 1-5.328 5.818 5.329 5.816 0 0 1-5.328-5.818 5.329 5.816 0 0 1 5.328-5.816m-3.34 18.791h6.678v23.906H36.4z"
                  style={{
                      fill: "#fff",
                      fillOpacity: 1,
                      strokeWidth: 3.80039
                  }}
            />
        </svg>
);
