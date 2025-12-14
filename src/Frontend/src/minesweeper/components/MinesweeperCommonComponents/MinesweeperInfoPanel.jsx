import React, {useLayoutEffect, useRef, useState} from "react";
import Box from "../../../components/Box";
import colors from "../../../Colors";

/**
 * @brief A styled information panel for Minesweeper game.
 * @details Displays a title and content, scaling to fit within a maximum
 *          height if provided.
 *
 * @param title The title of the info panel.
 * @param maxHeightPx Maximum height in pixels for scaling the content.
 * @param children The content to display inside the panel.
 * @param gap Gap between content elements.
 * @param paddingBottom Padding at the bottom of the content.
 * @param extraStyle Additional styles for the container.
 * @param extraTitleStyle Additional styles for the title.
 * @param extraContentStyle Additional styles for the content area.
 */
function MinesweeperInfoPanel({
                                  title = "Info",
                                  maxHeightPx,
                                  children,
                                  gap = "clamp(12px, 2vw, 16px)",
                                  paddingBottom = "clamp(12px, 2vw, 16px)",
                                  style: extraStyle = {},
                                  titleStyle: extraTitleStyle = {},
                                  contentStyle: extraContentStyle = {}
                              }) {
    const contentRef = useRef(null);
    const [scale, setScale] = useState(1);

    // Adjust scale to fit within maxHeightPx
    useLayoutEffect(() => {
        if(!maxHeightPx) {
            setScale(1);
            return;
        }
        const element = contentRef.current;
        if(!element) {
            return;
        }

        const previous = element.style.transform;
        element.style.transform = "none";
        const natural = element.scrollHeight || 1;
        const target = Math.max(0, maxHeightPx - 48);
        element.style.transform = previous;

        const scale = Math.min(1, target / natural);
        setScale(scale > 0.98 ? 1 : scale);
    }, [maxHeightPx, children]);

    // Styles
    const containerStyle = {
        boxSizing: "border-box",
        borderRadius: "clamp(20px, 3vw, 40px)",
        background: "#0F172A",
        color: colors?.text || "#CBD5E1",
        padding: "clamp(18px, 2.8vw, 24px)",
        position: "relative",
        zIndex: 1,
        maxHeight: maxHeightPx ? `${maxHeightPx}px` : undefined,
        overflow: "hidden",
        height: "fit-content",
        minWidth: "clamp(450px, 60vw, 650px)",
        maxWidth: "clamp(450px, 60vw, 650px)",
        ...extraStyle
    };

    const contentWrapStyle = {
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        gap: gap,
        paddingBottom: paddingBottom,
        ...extraContentStyle
    };

    const titleStyle = {
        margin: 0,
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 700,
        fontSize: "clamp(26px, 3.6vw, 45px)",
        lineHeight: 1.2,
        textAlign: "center",
        color: colors?.text_header || "#FFFFFF",
        marginBottom: "clamp(8px, 1.2vw, 12px)",
        ...extraTitleStyle
    };

    return (
            <Box style={containerStyle}>
                <div ref={contentRef}
                     style={contentWrapStyle}
                >
                    <h3 style={titleStyle}>{title}</h3>
                    {children}
                </div>
            </Box>
    );
}

export default MinesweeperInfoPanel;
