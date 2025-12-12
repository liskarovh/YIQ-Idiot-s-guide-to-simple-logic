// minesweeper/components/MinesweeperGameComponents/GameInfoPanel.jsx
import React from "react";
import Box from "../../../components/Box";
import colors from "../../../Colors";
import { formatTime } from "../../models/MinesweeperGame/MinesweeperGameRenderHelpers.jsx";

export function GameInfoPanel({
                                  view,
                                  difficulty,
                                  minesRemaining,
                                  hearts,
                                  showTimer,
                                  timerSec,
                                  isGameOver,
                                  hintsUsed,
                              }) {
    return (
            <Box
                    title={
                        isGameOver ? (view.status === "won" ? "Congratulations! 🎉" : "Game Over 💀") : "Game Info"
                    }
                    style={{ height: "fit-content" }}
            >
                <div style={{ display: "grid", gap: 8, fontSize: 16 }}>
                    <div>
                        <b>Difficulty:</b>
                        <span style={{ float: "right", color: colors.text_header }}>
            {difficulty || "Custom"}
          </span>
                    </div>
                    <div>
                        <b>Map Size:</b>
                        <span style={{ float: "right", color: colors.text_header }}>
            {view.rows}×{view.cols}
          </span>
                    </div>
                    <div>
                        <b>Mines Remaining:</b>
                        <span style={{ float: "right", color: colors.text_header }}>
            {minesRemaining}/{view.mines}
          </span>
                    </div>
                    <div>
                        <b>Lives:</b>
                        <span style={{ float: "right", color: colors.text_header }}>
            {view.lives?.total === 0 ? "∞" : `${view.lives?.left}/${view.lives?.total}`}
          </span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 14, marginBottom: 6, flexWrap: "wrap" }}>
                    {hearts.slice(0, 15).map((full, i) => (
                            <span key={i} style={{ fontSize: 28 }}>
            {full ? "❤️" : "🖤"}
          </span>
                    ))}
                    {hearts.length > 15 && (
                            <span style={{ fontSize: 18, alignSelf: "center", color: colors.text_header }}>
            +{hearts.length - 15}
          </span>
                    )}
                </div>

                {showTimer && (
                        <div
                                style={{
                                    textAlign: "center",
                                    color: colors.text_header,
                                    fontSize: 28,
                                    fontWeight: 800,
                                    marginTop: 8,
                                }}
                        >
                            {formatTime(timerSec)}
                        </div>
                )}

                {isGameOver && (
                        <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
                            <div>
                                <b>Total Deaths:</b>
                                <span style={{ float: "right", color: colors.text_header }}>
              {(view.lives?.total ?? 0) - (view.lives?.left ?? 0)}
            </span>
                            </div>
                            <div>
                                <b>Hints Used:</b>
                                <span style={{ float: "right", color: colors.text_header }}>{hintsUsed}</span>
                            </div>
                        </div>
                )}
            </Box>
    );
}
