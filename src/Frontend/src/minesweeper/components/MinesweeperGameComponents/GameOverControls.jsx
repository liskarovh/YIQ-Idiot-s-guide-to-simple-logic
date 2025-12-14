// minesweeper/components/MinesweeperGameComponents/GameOverControls.jsx
import React from "react";
import MinesweeperSlider from "../MinesweeperCommonComponents/MinesweeperSlider";
import MinesweeperNumberField from "../MinesweeperCommonComponents/MinesweeperNumberField";
import ActionPill from "./ActionPill.jsx";
import colors from "../../../Colors";

export function GameOverControls({ max, seekValue, onSeek, onPlayAgain, onExit }) {
    return (
            <div
                    style={{
                        width: "100%",
                        display: "grid",
                        gap: 12,
                        justifyItems: "center",
                        marginTop: 6,
                    }}
            >
                <div style={{ width: "82%", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: colors.text, fontWeight: 700, minWidth: 56 }}>Move:</span>
                    <div style={{ flex: 1 }}>
                        <MinesweeperSlider min={0} max={max} value={seekValue} onChange={onSeek} />
                    </div>
                    <MinesweeperNumberField value={seekValue} min={0} max={max} onChange={onSeek} />
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                    <ActionPill onClick={onPlayAgain}>Play Again</ActionPill>
                    <ActionPill onClick={onExit}>Exit Minesweeper</ActionPill>
                </div>
            </div>
    );
}
