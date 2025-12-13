import React, {useState} from "react";
import colors from "../Colors";
import AutoScale from "./AutoScale";
import {useRenderImage} from "../hooks/RenderImage";

/**
 * @brief Clickable game card with several options.
 * @details Displays a game's title, description and image and provides action handlers.
 *
 * @param baseWidth Design/base width in pixels used by AutoScale (default: 400).
 * @param baseHeight Design/base height in pixels used by AutoScale (default: 260).
 * @param title Main title text shown on the card.
 * @param description Short description text shown under the title.
 * @param image Image source URL or React element used as the card icon.
 * @param onCardClick Callback invoked when the card body is clicked.
 * @param onPlayNowClick Callback invoked when the "Play now" action is triggered.
 * @param onSettingsClick Callback invoked when the "Settings" action is triggered.
 * @param onStrategyClick Callback invoked when the "Strategy" action is triggered.
 * @param isStacked Whether the card is displayed in a stacked (vertical) layout; affects AutoScale fit/offset.
 */
function GameCard({
                      baseWidth = 400,
                      baseHeight = 260,
                      title,
                      description,
                      image,
                      onCardClick,
                      onPlayNowClick,
                      onSettingsClick,
                      onStrategyClick,
                      isStacked
                  }) {
    const [playNowHovered, setPlayNowHovered] = useState(false);
    const [settingsHovered, setSettingsHovered] = useState(false);
    const [strategyHovered, setStrategyHovered] = useState(false);

    const cardStyle = {
        width: `${baseWidth}px`,
        height: `${baseHeight}px`,
        borderRadius: "30px",
        background: `linear-gradient(to bottom,
      ${colors.secondary} 0%,
      ${colors.primary} 20%,
      ${colors.primary} 60%,
      ${colors.secondary} 100%)`,
        border: `2px solid ${colors.secondary}`,
        boxShadow: "-2px 8px 8px rgba(255, 255, 255, 0.15)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxSizing: "border-box",
        overflow: "hidden"
    };

    const topSectionStyle = {
        display: "flex",
        alignItems: "flex-start",
        gap: "2rem"
    };

    const imageStyle = {
        width: "60px",
        height: "60px",
        objectFit: "contain",
        flex: "0 0 auto"
    };

    const titleStyle = {
        fontSize: "36px",
        fontWeight: "400",
        color: colors.text_header,
        margin: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        flex: "0 1 auto",
        minWidth: 0
    };

    const descriptionStyle = {
        fontSize: "18px",
        fontWeight: "400",
        color: colors.text,
        margin: 0,
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        minWidth: 0
    };

    const actionsContainerStyle = {
        display: "flex",
        gap: "1.5rem",
        alignItems: "center"
    };

    const actionStyle = {
        fontSize: "18px",
        fontWeight: "400",
        color: colors.text_faded,
        background: "transparent",
        margin: 0,
        alignSelf: "flex-start",
        transition: "color 0.2s, transform 0.2s",
        cursor: "pointer"
    };

    const actionHoverStyle = {
        color: colors.text_header,
        transform: "translateY(-2px)"
    };

    const autoScaleStyle = {
        overflow: "visible"
    };

    const renderedImage = useRenderImage(image, title, imageStyle);

    return (
            <AutoScale
                    baseWidth={baseWidth}
                    baseHeight={baseHeight}
                    maxScale={1}
                    minScale={0.5}
                    center={true}
                    fit={isStacked ? "width" : "contain"}
                    offset={isStacked ? {width: 1, height: 0, unit: "rem"} : undefined}
                    style={autoScaleStyle}
            >
                <div
                        style={cardStyle}
                        onClick={onCardClick}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-5px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                >
                    <div style={topSectionStyle}>
                        {renderedImage}
                        <h3 style={titleStyle}>{title}</h3>
                    </div>

                    <div style={descriptionStyle}>
                        {description}
                    </div>

                    <div style={actionsContainerStyle}>
                        <span
                                style={{
                                    ...actionStyle,
                                    ...(playNowHovered ? actionHoverStyle : {})
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onPlayNowClick?.();
                                }}
                                onMouseEnter={() => setPlayNowHovered(true)}
                                onMouseLeave={() => setPlayNowHovered(false)}
                        >
                            Play now
                        </span>

                        <span
                                style={{
                                    ...actionStyle,
                                    ...(settingsHovered ? actionHoverStyle : {})
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onSettingsClick?.();
                                }}
                                onMouseEnter={() => setSettingsHovered(true)}
                                onMouseLeave={() => setSettingsHovered(false)}
                        >
                            Settings
                        </span>

                        <span
                                style={{
                                    ...actionStyle,
                                    ...(strategyHovered ? actionHoverStyle : {})
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onStrategyClick?.();
                                }}
                                onMouseEnter={() => setStrategyHovered(true)}
                                onMouseLeave={() => setStrategyHovered(false)}
                        >
                            Strategy
                        </span>

                    </div>
                </div>
            </AutoScale>
    );
}

export default GameCard;
