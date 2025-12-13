import React from "react";
import BarBtn from "./BarBtn";
import {DragAFlagIcon} from "../../../assets/icons/DragAFlagIcon";
import {HintIcon} from "../../../assets/icons/HintIcon";
import {PauseIcon} from "../../../assets/icons/PauseIcon";
import {QuickFlagOffIcon} from "../../../assets/icons/QuickFlagOffIcon";
import {QuickFlagOnIcon} from "../../../assets/icons/QuickFlagOnIcon";
import {ResumeIcon} from "../../../assets/icons/ResumeIcon";
import {StrategyIcon} from "../../../assets/icons/StrategyIcon";
import {UndoIcon} from "../../../assets/icons/UndoIcon";

export function ActionPanel({
                                enableHints,
                                allowUndo,
                                canUseActions,
                                paused,
                                beforeStart,
                                quickFlag,
                                cursor,
                                onStrategy,
                                onHint,
                                hintDisabled,
                                onPauseToggle,
                                onUndo,
                                onToggleQuickFlag
                            }) {
    return (
            <div
                    style={{
                        display: "flex",
                        gap: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 6,
                        flexWrap: "wrap"
                    }}
            >
                <BarBtn icon={
                    <StrategyIcon
                            widthHeight={50}
                    />}
                        label="Strategy"
                        onClick={onStrategy}
                />
                <BarBtn icon={
                    <HintIcon
                            widthHeight={50}
                    />}
                        label="Hint"
                        disabled={!enableHints || !canUseActions || hintDisabled}
                        onClick={onHint}
                />
                <BarBtn icon={paused ?
                              <ResumeIcon
                                      widthHeight={50}
                              /> :
                              <PauseIcon
                                      widthHeight={50}
                              />}
                        label={paused ? "Resume" : "Pause"}
                        disabled={beforeStart}
                        onClick={onPauseToggle}
                />
                <BarBtn icon={
                    <UndoIcon
                            widthHeight={50}
                    />}
                        label="Undo"
                        disabled={!allowUndo || !canUseActions || (cursor ?? 0) === 0}
                        onClick={onUndo}
                />
                <BarBtn icon={quickFlag ?
                              <QuickFlagOnIcon
                                      widthHeight={50}
                              /> :
                              <QuickFlagOffIcon
                                      widthHeight={50}
                              />}
                        label="Quick flag mode"
                        disabled={!canUseActions}
                        onClick={onToggleQuickFlag}
                        active={quickFlag}
                />
                <BarBtn icon={
                    <DragAFlagIcon
                            widthHeight={50}
                    />}
                        label="Drag-a-Flag"
                        disabled={!canUseActions}
                        onClick={() => {}}
                />
            </div>
    );
}
