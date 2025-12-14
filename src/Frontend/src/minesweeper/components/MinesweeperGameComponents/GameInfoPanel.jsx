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
    // Determine heart size based on maxHeightPx
    const heartSize = useMemo(() => {
        if(Number.isFinite(maxHeightPx) && maxHeightPx > 0) {
            const capByPanel = Math.max(12, Math.floor(maxHeightPx * 0.06));
            return `clamp(12px, min(3vmin, ${capByPanel}px), 24px)`;
        }
        return `clamp(12px, 3vmin, 24px)`;
    }, [maxHeightPx]);

    // Determine layout based on forceTwoColumns
    const effectiveColumns = forceTwoColumns ? 2 : 1;
    const effectiveColumnGap = (effectiveColumns === 2) ? (forcedColumnGap || "clamp(12px, 3.2vw, 22px)") : "clamp(12px, 2.8vw, 22px)";

    // Font sizes
    const labelFontSize = effectiveColumns === 2 ? "clamp(12px, 1.6vw, 16px)" : "clamp(14px, 2vw, 18px)";
    const valueFontSize = effectiveColumns === 2 ? "clamp(12px, 1.6vw, 16px)" : "clamp(14px, 2vw, 18px)";

    // Styles
    const containerGrid = {
        display: "grid",
        gridTemplateColumns: effectiveColumns === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
        columnGap: effectiveColumnGap,
        rowGap: "clamp(8px, 1.6vw, 12px)"
    };

    const pairRow = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        minWidth: 0
    };

    const label = {
        fontWeight: 600,
        fontSize: labelFontSize,
        lineHeight: 1.2,
        textAlign: "left",
        minWidth: 0,
        overflowWrap: "anywhere",
        wordBreak: "break-word"
    };

    const value = {
        fontWeight: 700,
        fontSize: valueFontSize,
        lineHeight: 1.2,
        color: colors?.text_header || "#FFFFFF",
        textAlign: "right",
        minWidth: 0,
        overflowWrap: "anywhere",
        wordBreak: "break-word"
    };

    const heartsContainer = {
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

    const timerStyle = {
        textAlign: "center",
        color: colors?.text_header || "#FFFFFF",
        fontSize: "clamp(22px, 3.6vw, 32px)",
        fontWeight: 800,
        marginTop: "clamp(6px, 1.4vw, 8px)"
    };

    const gameOverSection = {
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

    return (
            <MinesweeperInfoPanel
                    title={isGameOver ? (view.status === "won" ? "Congratulations! 🎉" : "Game Over 💀") : "Game Info"}
                    maxHeightPx={maxHeightPx}
                    style={{
                        minWidth: 0,
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box"
                    }}
                    contentStyle={{
                        maxWidth: "100%",
                        minWidth: 0
                    }}
            >
                <div style={containerGrid}>
                    {pairs.map(p => (
                            <div key={p.key} style={pairRow}>
                                <div style={label}>{p.label}</div>
                                <div style={value}>{p.value}</div>
                            </div>
                    ))}
                </div>

                {effectiveColumns === 2 ? (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            columnGap: effectiveColumnGap,
                            marginTop: "clamp(8px, 1.6vw, 12px)"
                        }}>
                            <div>
                                {showTimer && (
                                        <div style={pairRow}>
                                            <div style={label}>Time:</div>
                                            <div style={value}>{formatTime(timerSec)}</div>
                                        </div>
                                )}
                            </div>

                            <div style={heartsColumnRight}>
                                {heartRows.map((row, ri) => (
                                        <div key={ri} style={heartsRowRightStyle}>
                                            {row.map((full, i) => (
                                                    <span key={i} style={{fontSize: heartSize, lineHeight: 1}}>
                                                        {full ? "❤️" : "🖤"}
                                                    </span>
                                            ))}
                                        </div>
                                ))}
                            </div>
                        </div>
                ) : (
                         <>
                             <div style={heartsContainer}>
                                 {heartRows.map((row, ri) => (
                                         <div key={ri} style={heartsRowStyle}>
                                             {row.map((full, i) => (
                                                     <span key={i} style={{fontSize: heartSize, lineHeight: 1}}>
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
                        <div style={gameOverSection}>
                            <div style={containerGrid}>
                                <div style={pairRow}>
                                    <div style={label}>Total Deaths:</div>
                                    <div style={value}>
                                        {(view.lives?.total ?? 0) - (view.lives?.left ?? 0)}
                                    </div>
                                </div>

                                <div style={pairRow}>
                                    <div style={label}>Hints Used:</div>
                                    <div style={value}>{hintsUsed}</div>
                                </div>
                            </div>
                        </div>
                )}
            </MinesweeperInfoPanel>
    );
}

export default GameInfoPanel;
