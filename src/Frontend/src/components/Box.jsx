import React from "react";
import colors from "../Colors";

/**
 * @brief A styled box container with optional title and customizable styles.
 *
 * @param width Width of the box.
 * @param height Height of the box.
 * @param title Optional title displayed at the top of the box.
 * @param children Content to be rendered inside the box.
 * @param style Additional styles for the box container.
 * @param titleStyle Additional styles for the title.
 * @param replaceTitleStyle If passed, replaces the default title styles instead of merging.
 * @param transparent If true, makes the box background transparent and removes borders/shadows.
 */
function Box({
                 width,
                 height,
                 title,
                 children,
                 style = {},
                 titleStyle = {},
                 replaceTitleStyle = null,
                 transparent = false
             }) {
    const boxStyle = {
        width: width,
        height: height,
        borderRadius: "40px",
        backgroundColor: colors.secondary,
        color: colors.text,
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "-6px 5px 6px rgba(255, 255, 255, 0.25)",
        margin: "0 0 4px 4px",
        padding: "2rem",
        ...style  // Allows additional custom styles to be passed in
    };

    if(transparent) {
        boxStyle.backgroundColor = "transparent";
        boxStyle.boxShadow = "none";
        boxStyle.border = "none";
        boxStyle.padding = 0;
        boxStyle.margin = 0;
    }

    const finalTitleStyle = replaceTitleStyle ? replaceTitleStyle
                                              : {
                margin: 0,
                marginBottom: "15px",
                color: colors.text_header,
                fontWeight: 700,
                fontSize: "45px",
                textAlign: "center",
                ...titleStyle  // Allows additional custom title styles to be passed in
            };

    return (
            <div style={boxStyle}>
                {title &&
                 <h3 style={finalTitleStyle}>{title}</h3>}
                {children}
            </div>
    );
}

export default Box;
