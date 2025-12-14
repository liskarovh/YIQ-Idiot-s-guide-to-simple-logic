/**
 * @file StrategyIcon.jsx
 * @brief SVG icon component representing a strategy symbol.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React from "react";

export const UndoIcon = ({widthHeight = 80}) => (
        <svg xmlns="http://www.w3.org/2000/svg"
             width={widthHeight}
             height={widthHeight}
             fill="none"
             viewBox="0 0 80 80"
        >
            <path d="M.672 22.584.5 57.304l35.236.112-14.187-14.092c1.091-.797 5.443-3.912 8.018-4.898 4.505-1.726 8.63-3.053 13.444-2.761 3.976.241 9.175 2.496 12.743 4.268 3.212 1.596 7.228 5.344 9.6 8.034 2.932 3.327 4.905 9.291 4.905 9.291l9.241-3.07c-.47-3.435-1.505-4.926-3.13-7.467s-3.923-5.567-6.107-8.03c-3.272-3.008-10.271-8.249-14.959-9.762-4.266-1.377-9.903-2.502-12.458-2.553-4.93-.097-11.003 1.055-15.631 2.759-4.337 1.596-11.175 6.312-12.594 7.306z"
                  style={{
                      fill: "#fff",
                      strokeWidth: 3.60701,
                      paintOrder: "markers fill stroke"
                  }}
            />
        </svg>
);
