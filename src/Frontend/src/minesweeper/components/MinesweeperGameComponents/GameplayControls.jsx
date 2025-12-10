// minesweeper/components/MinesweeperGameComponents/GameplayControls.jsx
import React from "react";
import BarBtn from "./BarBtn.jsx";
import { IHint, IPause, IPlay, IUndo, IFlag, IDrag } from "./Icons.jsx";

export function GameplayControls({
                                     enableHints,
                                     allowUndo,
                                     canUseActions,
                                     paused,
                                     beforeStart,
                                     quickFlag,
                                     cursor,
                                     onHint,
                                     onPauseToggle,
                                     onUndo,
                                     onToggleQuickFlag,
                                 }) {
    return (
            <div
                    style={{
                        display: "flex",
                        gap: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 6,
                        flexWrap: "wrap",
                    }}
            >
                <BarBtn icon={IHint} label="Hint" disabled={!enableHints || !canUseActions} onClick={onHint} />
                <BarBtn
                        icon={paused ? IPlay : IPause}
                        label={paused ? "Resume" : "Pause"}
                        disabled={beforeStart}
                        onClick={onPauseToggle}
                />
                <BarBtn
                        icon={IUndo}
                        label="Undo"
                        disabled={!allowUndo || !canUseActions || (cursor ?? 0) === 0}
                        onClick={onUndo}
                />
                <BarBtn
                        icon={
                            <div style={{ display: "grid", placeItems: "center" }}>
                                {IFlag}
                                <div style={{ fontSize: 10, marginTop: 2 }}>{quickFlag ? "ON" : "OFF"}</div>
                            </div>
                        }
                        label="Quick Flag"
                        disabled={!canUseActions}
                        onClick={onToggleQuickFlag}
                        active={quickFlag}
                />
                <BarBtn icon={IDrag} label="Drag Flag" disabled={!canUseActions} onClick={() => {}} />
            </div>
    );
}
