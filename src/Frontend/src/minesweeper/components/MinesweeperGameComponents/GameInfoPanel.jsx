import React, {useMemo} from "react";
import InfoPanel from "../InfoPanel";
import colors from "../../../Colors";
import {formatTime} from "../../models/MinesweeperGame/MinesweeperGameRenderHelpers";

export function GameInfoPanel({
                                  view,
                                  difficulty,
                                  minesRemaining,
                                  hearts,
                                  showTimer,
                                  timerSec,
                                  isGameOver,
                                  hintsUsed,
                                  maxHeightPx
                              }) {
    const heartSize = useMemo(() => {
        if(Number.isFinite(maxHeightPx) && maxHeightPx > 0) {
            const capByPanel = Math.max(20, Math.floor(maxHeightPx * 0.08));
            return `clamp(20px, min(4vmin, ${capByPanel}px), 32px)`;
        }
        return `clamp(20px, 4vmin, 32px)`;
    }, [maxHeightPx]);

    const grid = {
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        columnGap: 'clamp(12px, 2.8vw, 22px)',
        rowGap: 'clamp(8px, 1.6vw, 12px)',
        alignItems: 'center',
        justifyContent: 'start',
        maxWidth: '100%'
    };

    const label = {
        fontWeight: 600,
        fontSize: 'clamp(14px, 2vw, 18px)',
        lineHeight: 1.2,
        textAlign: 'left',
        justifySelf: 'start'
    };

    const value = {
        fontWeight: 700,
        fontSize: 'clamp(14px, 2vw, 18px)',
        lineHeight: 1.2,
        color: colors?.text_header || '#FFFFFF',
        textAlign: 'right',
        justifySelf: 'end'
    };

    const heartsContainer = {
        display: 'flex',
        gap: 'clamp(4px, 1vw, 8px)',
        marginTop: 'clamp(8px, 1.6vw, 14px)',
        marginBottom: 'clamp(4px, 1vw, 6px)',
        flexWrap: 'wrap',
        justifyContent: 'center'
    };

    const timerStyle = {
        textAlign: 'center',
        color: colors?.text_header || '#FFFFFF',
        fontSize: 'clamp(22px, 3.6vw, 32px)',
        fontWeight: 800,
        marginTop: 'clamp(6px, 1.4vw, 8px)'
    };

    const gameOverSection = {
        marginTop: 'clamp(10px, 2vw, 14px)',
        display: 'grid',
        gap: 'clamp(4px, 1vw, 6px)'
    };

    return (
            <InfoPanel
                    title={isGameOver ? (view.status === "won" ? "Congratulations! 🎉" : "Game Over 💀") : "Game Info"}
                    maxHeightPx={maxHeightPx}
            >
                <div style={grid}>
                    <div style={label}>Difficulty:</div>
                    <div style={value}>{difficulty || "Custom"}</div>

                    <div style={label}>Map size:</div>
                    <div style={value}>{view.rows}×{view.cols}</div>

                    <div style={label}>Mines left:</div>
                    <div style={value}>{minesRemaining}/{view.mines}</div>

                    <div style={label}>Lives left:</div>
                    <div style={value}>
                        {view.lives?.total === 0 ? "∞" : `${view.lives?.left}/${view.lives?.total}`}
                    </div>
                </div>

                <div style={heartsContainer}>
                    {hearts.slice(0, 15).map((full, i) => (
                            <span key={i} style={{fontSize: heartSize}}>
                        {full ? "❤️" : "🖤"}
                    </span>
                    ))}
                    {hearts.length > 15 && (
                            <span style={{
                                fontSize: 'clamp(14px, 2vw, 18px)',
                                alignSelf: 'center',
                                color: colors?.text_header || '#FFFFFF'
                            }}>
                        +{hearts.length - 15}
                    </span>
                    )}
                </div>

                {showTimer && (
                        <div style={timerStyle}>
                            {formatTime(timerSec)}
                        </div>
                )}

                {isGameOver && (
                        <div style={gameOverSection}>
                            <div style={grid}>
                                <div style={label}>Total Deaths:</div>
                                <div style={value}>
                                    {(view.lives?.total ?? 0) - (view.lives?.left ?? 0)}
                                </div>

                                <div style={label}>Hints Used:</div>
                                <div style={value}>{hintsUsed}</div>
                            </div>
                        </div>
                )}
            </InfoPanel>
    );
}

export default GameInfoPanel;
