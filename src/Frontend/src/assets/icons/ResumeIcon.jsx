/**
 * @file ResumeIcon.jsx
 * @brief SVG icon component for a resume symbol.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React from "react";

export const ResumeIcon = ({widthHeight = 80}) => (
        <svg xmlns="http://www.w3.org/2000/svg"
             width={widthHeight}
             height={widthHeight}
             fill="none"
             viewBox="0 0 80 80"
        >
            <path d="M6.478 77.427V2.573L73.522 40Z"
                  style={{
                      fill: "#fff",
                      fillRule: "evenodd",
                      stroke: "#fff",
                      strokeLinejoin: "round",
                      strokeWidth: "5.147"
                  }}
            />
        </svg>
);
