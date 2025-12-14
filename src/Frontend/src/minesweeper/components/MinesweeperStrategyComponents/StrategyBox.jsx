/**
 * @file StrategyBox.jsx
 * @brief A React component that renders a styled box for displaying Minesweeper strategies.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import colors from "../../../Colors";
import Box from "../../../components/Box";

function StrategyBox({title, transparent = false, style, children}) {
    const boxTitleStyle = {
        fontWeight: 700,
        fontSize: "clamp(18px, 2.2vw, 30px)",
        lineHeight: 1.15,
        textAlign: "center",
        color: colors.text,
        letterSpacing: "-0.02em",
        margin: "0 0 clamp(10px, 1.6vw, 16px)",
        padding: "0 clamp(10px, 2.5vw, 28px)",
        boxSizing: "border-box",
        whiteSpace: "normal",
        overflow: "visible",
        textOverflow: "clip"
    };

    return (
            <Box title={title}
                 replaceTitleStyle={boxTitleStyle}
                 style={{
                     padding: "2rem 0rem 2rem 0rem",
                     margin: 0,
                     ...style
                 }}
                 transparent={transparent}
            >
                {children}
            </Box>
    );
}

export default StrategyBox;
