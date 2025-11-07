import React from "react";
import colors from "../Colors";

/**
 * BOX COMPONENT - Container for content
 *
 * Props:
 * - width: string - Box width (e.g., '600px', '100%')
 * - height: string - Box height (e.g., '400px', 'auto')
 * - children: ReactNode - Content inside the box
 * - style: object - Additional custom styles (optional)
 */

function Box({
                 width,
                 height,
                 title,
                 children,
                 style = {}
             }) {
    const boxStyle = {
        width: width,
        height: height,
        borderRadius: "40px",
        backgroundColor: colors.secondary,
        color: colors.text,
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "-4px 2px 4px rgba(255, 255, 255, 0.25)",
        padding: "2rem",
        ...style  // Allows additional custom styles to be passed in
    };

    const titleStyle = {
        margin: 0,
        marginBottom: "15px",
        color: colors.text_header,
        fontWeight: 700,
        fontSize: "45px",
        textAlign: "center"
    };

    return (
            <div style={boxStyle}>
                {title &&
                 <h3 style={titleStyle}>{title}</h3>}
                {children}
            </div>
    );
}

export default Box;
