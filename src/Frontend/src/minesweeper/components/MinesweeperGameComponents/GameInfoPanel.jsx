import React, {useMemo} from "react";
import MinesweeperInfoPanel from "../MinesweeperCommonComponents/MinesweeperInfoPanel";
import colors from "../../../Colors";
import {formatTime} from "../../models/MinesweeperGame/MinesweeperGameRenderHelpers";

function GameInfoPanel({
                           view,
                           difficulty,
                           minesRemaining,
                           hearts,
                           showTimer,
                           timerSec,
                           isGameOver,
                           hintsUsed,
                           maxHeightPx,
                           forceTwoColumns = false,
                           columnGap: forcedColumnGap = undefined
                       }) {
    // Determine layout based on forceTwoColumns
    const effectiveColumns = forceTwoColumns ? 2 : 1;
    const effectiveColumnGap = (effectiveColumns === 2) ? (forcedColumnGap || "clamp(12px, 3.2vw, 22px)") : "clamp(12px, 2.8vw, 22px)";

    // Font sizes
    const labelFontSize = effectiveColumns === 2 ? "clamp(12px, 1.6vw, 16px)" : "clamp(14px, 2vw, 18px)";
    const valueFontSize = effectiveColumns === 2 ? "clamp(12px, 1.6vw, 16px)" : "clamp(14px, 2vw, 18px)";
    const heartFontSize = effectiveColumns === 2 ? "clamp(12px, 1.6vw, 16px)" : `clamp(12px, calc(${valueFontSize} * 2), 48px)`;

    // Determine gradient and accent colors based on game state
    const isWon = isGameOver && view.status === "won";
    const isLost = isGameOver && view.status !== "won";

    // Background gradient for special panel forms
    const customStyle = (isWon || isLost) ? {
        background: isWon
                    ? "linear-gradient(180deg, #052E25 0%, #0F172A 100%)"
                    : "linear-gradient(180deg, #2A0F0F 0%, #0F172A 100%)",
        borderRadius: "clamp(20px, 3vw, 40px)",
        filter: isWon
                ? "drop-shadow(-2px 4px 6px rgba(0,255,170,0.25))"
                : "drop-shadow(-2px 4px 6px rgba(255,80,80,0.25))"
    } : {};

    const accentColor = isWon
                        ? "#00E6A8"
                        : isLost
                          ? "#FF6B6B"
                          : colors?.text_header || "#FFFFFF";

    const labelColor = isWon
                       ? "#A7F3D0"
                       : isLost
                         ? "#FFC2C2"
                         : colors?.text || "#E2E8F0";

    const valueColor = "#FFFFFF";

    // Styles
    const containerGridStyle = {
        display: "grid",
        gridTemplateColumns: effectiveColumns === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
        columnGap: effectiveColumnGap,
        rowGap: "clamp(8px, 1.6vw, 12px)"
    };

    const pairRowStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        minWidth: 0
    };

    const labelStyle = {
        fontWeight: 600,
        fontSize: labelFontSize,
        lineHeight: 1.2,
        textAlign: "left",
        minWidth: 0,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        color: labelColor
    };

    const valueStyle = {
        fontWeight: 700,
        fontSize: valueFontSize,
        lineHeight: 1.2,
        color: valueColor,
        textAlign: "right",
        minWidth: 0,
        overflowWrap: "anywhere",
        wordBreak: "break-word"
    };

    const heartsContainerStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginTop: "clamp(8px, 1.6vw, 14px)",
        marginBottom: "clamp(4px, 1vw, 6px)",
        width: "100%",
        boxSizing: "border-box"
    };

    const heartsRowStyle = {
        display: "flex",
        gap: "clamp(4px, 1vw, 8px)",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "nowrap",
        width: "100%"
    };

    const heartsColumnRight = {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        alignItems: "flex-end",
        justifyContent: "center",
        width: "100%",
        boxSizing: "border-box"
    };

    const heartsRowRightStyle = {
        display: "flex",
        gap: "clamp(4px, 1vw, 8px)",
        justifyContent: "flex-end",
        alignItems: "center",
        flexWrap: "nowrap",
        width: "100%"
    };

    const heartsStyle = {
        fontSize: heartFontSize,
        display: "inline-block",
        minWidth: 0,
        verticalAlign: "middle"
    };

    const timerStyle = {
        textAlign: "center",
        color: valueColor,
        fontSize: "clamp(22px, 3.6vw, 32px)",
        fontWeight: 800,
        marginTop: "clamp(6px, 1.4vw, 8px)"
    };

    const gameOverStyle = {
        marginTop: "clamp(10px, 2vw, 14px)",
        display: "grid",
        gap: "clamp(4px, 1vw, 6px)"
    };

    // Helper to chunk hearts into rows
    const chunkArray = (heartsArray, size) => {
        const out = [];
        for(let iHeart = 0; iHeart < heartsArray.length; iHeart += size) {
            out.push(heartsArray.slice(iHeart, iHeart + size));
        }
        return out;
    };

    // Chunk hearts into rows of 5
    const HEARTS_PER_ROW = 5;
    const heartRows = chunkArray(hearts || [], HEARTS_PER_ROW);

    // Key-value pairs to display
    const pairs = [
        {key: "difficulty", label: "Difficulty:", value: difficulty || "Custom"},
        {key: "mapsize", label: "Map size:", value: `${view.rows}×${view.cols}`},
        {key: "minesleft", label: "Mines left:", value: `${minesRemaining}/${view.mines}`},
        {key: "lives", label: "Lives left:", value: view.lives?.total === 0 ? "∞" : `${view.lives?.left}/${view.lives?.total}`},
    ];

    const titleText = isGameOver
                      ? (view.status === "won" ? "You Win! 🎉" : "Game Over 💀")
                      : "Game Info";

    return (
            <MinesweeperInfoPanel
                    title={titleText}
                    maxHeightPx={maxHeightPx}
                    style={{
                        minWidth: 0,
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        ...customStyle
                    }}
                    contentStyle={{
                        maxWidth: "100%",
                        minWidth: 0
                    }}
                    titleStyle={(isWon || isLost) ? {
                        color: accentColor,
                        fontWeight: 900,
                        fontSize: "clamp(28px, 4vw, 52px)"
                    } : undefined}
            >
                <div style={containerGridStyle}>
                    {pairs.map(p => (
                            <div key={p.key} style={pairRowStyle}>
                                <div style={labelStyle}>{p.label}</div>
                                <div style={valueStyle}>{p.value}</div>
                            </div>
                    ))}
                </div>

                {effectiveColumns === 2 ? (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            columnGap: effectiveColumnGap,
                            marginTop:"-0.2rem"
                        }}>
                            <div>
                                {showTimer && (
                                        <div style={pairRowStyle}>
                                            <div style={labelStyle}>Time:</div>
                                            <div style={valueStyle}>{formatTime(timerSec)}</div>
                                        </div>
                                )}
                            </div>

                            <div style={heartsColumnRight}>
                                {heartRows.map((row, ri) => (
                                        <div key={ri} style={heartsRowRightStyle}>
                                            {row.map((full, i) => (
                                                    <span key={i} style={heartsStyle}>
                                                        {full ? "❤️" : "🖤"}
                                                    </span>
                                            ))}
                                        </div>
                                ))}
                            </div>
                        </div>
                ) : (
                        <>
                            <div style={heartsContainerStyle}>
                                {heartRows.map((row, ri) => (
                                        <div key={ri} style={heartsRowStyle}>
                                            {row.map((full, i) => (
                                                    <span key={i} style={heartsStyle}>
                                                        {full ? "❤️" : "🖤"}
                                                    </span>
                                            ))}
                                        </div>
                                ))}
                            </div>

                            {showTimer && (
                                    <div style={timerStyle}>
                                        {formatTime(timerSec)}
                                    </div>
                            )}
                        </>
                )}

                {isGameOver && (
                        <div style={gameOverStyle}>
                            <div style={containerGridStyle}>
                                <div style={pairRowStyle}>
                                    <div style={labelStyle}>Total deaths:</div>
                                    <div style={valueStyle}>
                                        {(view.lives?.total ?? 0) - (view.lives?.left ?? 0)}
                                    </div>
                                </div>

                                <div style={pairRowStyle}>
                                    <div style={labelStyle}>Hints used:</div>
                                    <div style={valueStyle}>{hintsUsed}</div>
                                </div>
                            </div>
                        </div>
                )}
            </MinesweeperInfoPanel>
    );
}

export default GameInfoPanel;
