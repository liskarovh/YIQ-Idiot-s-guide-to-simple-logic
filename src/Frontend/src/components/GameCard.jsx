import React, {useLayoutEffect, useRef, useState} from "react";
import colors from "../Colors";
import {useRenderImage} from "../hooks/RenderImage";

/**
 * @brief Clickable game card with several options.
 * @details Displays a game's title, description and image and provides action handlers.
 *
 * @param maxWidth Maximum width of the card in pixels. Default is 450.
 * @param maxHeight Maximum height of the card in pixels. Default is 260.
 * @param title Main title text shown on the card.
 * @param description Short description text shown under the title.
 * @param image Image source URL or React element used as the card icon.
 * @param onCardClick Callback invoked when the card body is clicked.
 * @param onPlayNowClick Callback invoked when the "Play now" action is triggered.
 * @param onSettingsClick Callback invoked when the "Settings" action is triggered.
 * @param onStrategyClick Callback invoked when the "Strategy" action is triggered.
 */
function GameCard({
                      maxWidth = 400,
                      maxHeight = 260,
                      title,
                      description,
                      image,
                      onCardClick,
                      onPlayNowClick,
                      onSettingsClick,
                      onStrategyClick
                  }) {
    const [playNowHovered, setPlayNowHovered] = useState(false);
    const [settingsHovered, setSettingsHovered] = useState(false);
    const [strategyHovered, setStrategyHovered] = useState(false);

    const contentRef = useRef(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        if(!maxHeight) {
            setScale(1);
            return;
        }
        const el = contentRef.current;
        if(!el) {
            return;
        }

        const prev = el.style.transform;
        el.style.transform = "none";
        const natural = el.scrollHeight || 1;
        const target = Math.max(0, maxHeight - 48);
        el.style.transform = prev;

        const s = Math.min(1, target / natural);
        setScale(s > 0.98 ? 1 : s);
    }, [maxHeight, title, description, image]);

    const cardStyle = {
        maxWidth: `${maxWidth}px`,
        borderRadius: "30px",
        background: `linear-gradient(to bottom,
      ${colors.secondary} 0%,
      ${colors.primary} 20%,
      ${colors.primary} 60%,
      ${colors.secondary} 100%)`,
        border: `2px solid ${colors.secondary}`,
        boxShadow: "-2px 8px 8px rgba(255, 255, 255, 0.15)",
        padding: "clamp(12px, 2vw, 20px)",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxSizing: "border-box",
        overflow: "hidden",
        height: "fit-content"
    };

    const contentWrap = {
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(8px, 1.2vw, 12px)"
    };

    const topSectionStyle = {
        minHeight: "4.2rem",
        display: "flex",
        alignItems: "center",
        gap: "clamp(16px, 2.5vw, 32px)"
    };

    const imageStyle = {
        width: "clamp(50px, 8vw, 60px)",
        height: "clamp(50px, 8vw, 60px)",
        objectFit: "contain",
        flex: "0 0 auto"
    };

    const titleStyle = {
        fontSize: "clamp(28px, 4vw, 36px)",
        fontWeight: "400",
        color: colors.text_header,
        margin: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        flex: "0 1 auto",
        minWidth: 0,
        lineHeight: 1.2
    };

    const descriptionStyle = {
        minHeight: "5rem",
        fontSize: "clamp(16px, 2.3vw, 18px)",
        fontWeight: "400",
        color: colors.text,
        margin: 0,
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        textAlign: "left",
        minWidth: 0
    };

    const actionsContainerStyle = {
        display: "flex",
        gap: "clamp(18px, 2.8vw, 24px)",
        alignItems: "center"
    };

    const actionStyle = {
        fontSize: "clamp(14px, 2vw, 18px)",
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

    const renderedImage = useRenderImage(image, title, imageStyle);

    return (
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
                <div ref={contentRef}
                     style={contentWrap}
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
            </div>
    );
}

export default GameCard;
