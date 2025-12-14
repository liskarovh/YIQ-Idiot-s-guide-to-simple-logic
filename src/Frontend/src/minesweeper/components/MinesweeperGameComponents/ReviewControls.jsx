// minesweeper/components/MinesweeperGameComponents/ReviewControls.jsx
import React from "react";
import MinesweeperSlider from "../MinesweeperCommonComponents/MinesweeperSlider";
import MinesweeperNumberField from "../MinesweeperCommonComponents/MinesweeperNumberField";
import ActionPill from "./ActionPill.jsx";
import colors from "../../../Colors";

export function ReviewControls({
                                   busy,
                                   max,
                                   value,      // current view.cursor
                                   seekValue,  // UI seekIndex
                                   onSeek,
                                   onUndoAndRevive,
                                   onReviveFromMove,
                                   onPlayAgain
                               }) {
    return (
            <div
                    style={{
                        width: "100%",
                        display: "grid",
                        gap: 12,
                        justifyItems: "center",
                        marginTop: 6
                    }}
            >
                <div style={{width: "82%", display: "flex", alignItems: "center", gap: 10}}>
                    <span style={{color: colors.text, fontWeight: 700, minWidth: 56}}>Move:</span>
                    <div style={{flex: 1}}>
                        <MinesweeperSlider min={0}
                                           max={max}
                                           value={value}
                                           onChange={onSeek}
                        />
                    </div>
                    <MinesweeperNumberField
                            value={value}
                            minValue={0}
                            maxValue={max}
                            onChange={onSeek}
                    />
                </div>
                <div style={{display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center"}}>
                    <ActionPill
                            onClick={onUndoAndRevive}
                            disabled={busy}
                    >
                        Undo & Revive
                    </ActionPill>
                    <ActionPill
                            onClick={onReviveFromMove}
                            disabled={busy}
                    >
                        Revive from Move {value ?? 0}
                    </ActionPill>
                    <ActionPill
                            onClick={onPlayAgain}
                    >Play Again</ActionPill>
                </div>
            </div>
    );
}
