import React from "react";
import colors from "../Colors";
import AutoScale from "./AutoScale";

/**
 * GAME CARD COMPONENT - Displays a game option
 *
 * Props:
 * - title: string - Game title
 * - description: string - Game description
 * - image: string - Path to game icon/image
 * - onClick: function - Callback when card is clicked
 */

function GameCard({
                      baseWidth = 400,
                      baseHeight = 260,
                      title,
                      description,
                      image,
                      onClick
                  }) {
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
        alignItems: "center",
        gap: "1rem"
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
        flex: "1 1 auto",
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

    const playNowStyle = {
        fontSize: "18px",
        fontWeight: "400",
        color: colors.text_faded,
        margin: 0,
        alignSelf: "flex-start"
    };

    const autoScaleStyle = {
        display: "inline-block",
        width: baseWidth,
        height: baseHeight,
        boxSizing: "border-box",
        overflow: "visible"
    };

    const renderImage = () => {
        if(typeof image === "string" && image) {
            return <img
                    src={image}
                    alt={title}
                    style={imageStyle}
            />;
        }
        if(React.isValidElement(image)) {
            return React.cloneElement(image, {style: {...(image.props?.style || {}), ...imageStyle}});
        }
        if(typeof image === "function") {
            const ImgComp = image;
            return <ImgComp
                    style={imageStyle}
            />;
        }
        return null;
    };

    return (
            <AutoScale
                    baseWidth={baseWidth}
                    baseHeight={baseHeight}
                    minScale={0.5}
                    maxScale={1}
                    center={true}
                    style={autoScaleStyle}
            >
                <div
                        style={cardStyle}
                        onClick={onClick}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-5px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                >
                    <div style={topSectionStyle}>
                        {renderImage()}
                        <h3 style={titleStyle}>{title}</h3>
                    </div>

                    <p style={descriptionStyle}>
                        {description}
                    </p>

                    <p style={playNowStyle}>
                        Play now
                    </p>
                </div>
            </AutoScale>
    );
}

export default GameCard;
