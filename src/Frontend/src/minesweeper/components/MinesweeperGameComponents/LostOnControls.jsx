import React from "react";
import MinesweeperSlider from "../MinesweeperCommonComponents/MinesweeperSlider";
import MinesweeperNumberField from "../MinesweeperCommonComponents/MinesweeperNumberField";
import MinesweeperBoxButton from "../MinesweeperCommonComponents/MinesweeperBoxButton";
import colors from "../../../Colors";

function LostOnControls({
                            busy,
                            max,
                            value,
                            onSeek,
                            onUndoAndRevive,
                            onReviveFromMove,
                            onPlayAgain
                        }) {
    return (
            <div
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "clamp(12px, 2vw, 20px)",
                        alignItems: "center",
                        padding: "clamp(6px, 1.2vw, 10px) 0"
                    }}
            >
                {/* Slider section */}
                <div
                        style={{
                            width: "min(100%, 800px)",
                            display: "flex",
                            alignItems: "center",
                            gap: "clamp(16px, 2vw, 24px)",
                            padding: "0 clamp(12px, 2vw, 24px)"
                        }}
                >
                    <span
                            style={{
                                color: colors.text,
                                fontWeight: 700,
                                fontSize: "clamp(16px, 2.5vw, 20px)",
                                minWidth: "fit-content",
                                whiteSpace: "nowrap"
                            }}
                    >
                        Move:
                    </span>
                    <div style={{flex: 1, minWidth: 0}}>
                        <MinesweeperSlider
                                min={0}
                                max={max}
                                value={value}
                                onChange={onSeek}
                                width="100%"
                        />
                    </div>
                    <MinesweeperNumberField
                            value={value}
                            minValue={0}
                            maxValue={max}
                            onChange={onSeek}
                    />
                </div>

                {/* Buttons section */}
                <div
                        style={{
                            display: "flex",
                            gap: "clamp(8px, 1.5vw, 14px)",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            padding: "0 clamp(12px, 2vw, 24px)"
                        }}
                >
                    <MinesweeperBoxButton
                            title="Undo & Revive"
                            onClick={onUndoAndRevive}
                            disabled={busy}
                            background={colors.secondary}
                            color={colors.text_header}
                            style={{
                                fontSize: "clamp(13px, 1.8vw, 15px)",
                                padding: "clamp(8px, 1.2vw, 12px) clamp(14px, 2vw, 20px)"
                            }}
                    />
                    <MinesweeperBoxButton
                            title={`Revive from Move ${value ?? 0}`}
                            onClick={onReviveFromMove}
                            disabled={busy}
                            background={colors.secondary}
                            color={colors.text_header}
                            style={{
                                fontSize: "clamp(13px, 1.8vw, 15px)",
                                padding: "clamp(8px, 1.2vw, 12px) clamp(14px, 2vw, 20px)"
                            }}
                    />
                    <MinesweeperBoxButton
                            title="Play Again"
                            onClick={onPlayAgain}
                            background={colors.secondary}
                            color={colors.text_header}
                            style={{
                                fontSize: "clamp(13px, 1.8vw, 15px)",
                                padding: "clamp(8px, 1.2vw, 12px) clamp(14px, 2vw, 20px)"
                            }}
                    />
                </div>
            </div>
    );
}

export default LostOnControls;
