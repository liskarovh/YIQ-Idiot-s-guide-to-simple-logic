import {useRef} from "react";
import ActionButton from "./ActionButton";
import {DragAFlagIcon} from "../../../assets/icons/DragAFlagIcon";
import {HintIcon} from "../../../assets/icons/HintIcon";
import {PauseIcon} from "../../../assets/icons/PauseIcon";
import {QuickFlagOffIcon} from "../../../assets/icons/QuickFlagOffIcon";
import {QuickFlagOnIcon} from "../../../assets/icons/QuickFlagOnIcon";
import {ResumeIcon} from "../../../assets/icons/ResumeIcon";
import {StrategyIcon} from "../../../assets/icons/StrategyIcon";
import {UndoIcon} from "../../../assets/icons/UndoIcon";
import {useMediaQuery} from "../../hooks/UseMediaQuery";
import {Flag} from "../../../assets/minesweeper/Flag";

function ActionBar({
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
    const isNarrow = useMediaQuery("(max-width: 450px)");
    const isMedium = useMediaQuery("(max-width: 900px)");
    const iconSize = isNarrow ? 30 : isMedium ? 35 : 50;
    const buttonSize = isNarrow ? 60 : isMedium ? 75 : 90;

    // Drag-and-drop handlers for Drag-a-Flag
    const dragImageRef = useRef(null);

    function handleDragStart(event) {
        if(!canUseActions) {
            event.preventDefault();
            return;
        }

        // Access dataTransfer object
        const dataTransfer = event.dataTransfer;
        if(!dataTransfer) {
            return;
        }

        try {
            // Set data type that MineGrid will recognize as drag-a-flag
            dataTransfer.setData("application/x-drag-flag", "1");
            dataTransfer.effectAllowed = "copy";

            // Use the pre-rendered hidden Flag element as drag image
            if(dragImageRef.current) {
                const svg = dragImageRef.current.querySelector("svg");
                if(svg) {
                    const rect = svg.getBoundingClientRect();
                    dataTransfer.setDragImage(dragImageRef.current, rect.width / 2, rect.height / 2);
                }
            }
        }
        catch {
            // ignore
        }
    }

    return (
            <>
                {/* Hidden container for SVG serialization */}
                <div
                        ref={dragImageRef}
                        aria-hidden="true"
                        style={{
                            position: "fixed",
                            left: -9999,
                            top: -9999,
                            width: 40,
                            height: 40,
                            pointerEvents: "none",
                            opacity: 1
                        }}
                >
                    <Flag widthAndHeight={40} />
                </div>

                {/* Action buttons container */}
                <div style={{
                    display: "flex",
                    gap: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 6,
                    flexWrap: "wrap"
                }}
                >
                    <ActionButton
                            icon={
                                <StrategyIcon
                                        widthHeight={iconSize}
                                />}
                            label="Strategy"
                            onClick={onStrategy}
                            style={{width: buttonSize}}
                    />
                    <ActionButton
                            icon={
                                <HintIcon
                                        widthHeight={iconSize}
                                />}
                            label="Hint"
                            disabled={!enableHints || !canUseActions || hintDisabled}
                            onClick={onHint}
                            style={{width: buttonSize}}
                    />
                    <ActionButton
                            icon={paused ?
                                  <ResumeIcon
                                          widthHeight={iconSize}
                                  /> :
                                  <PauseIcon
                                          widthHeight={iconSize}
                                  />}
                            label={paused ? "Resume" : "Pause"}
                            disabled={beforeStart}
                            onClick={onPauseToggle}
                            style={{width: buttonSize}}
                    />
                    <ActionButton
                            icon={
                                <UndoIcon
                                        widthHeight={iconSize}
                                />}
                            label="Undo"
                            disabled={!allowUndo || !canUseActions || (cursor ?? 0) === 0}
                            onClick={onUndo}
                            style={{width: buttonSize}}
                    />
                    <ActionButton
                            icon={quickFlag ?
                                  <QuickFlagOnIcon
                                          widthHeight={iconSize}
                                  /> :
                                  <QuickFlagOffIcon
                                          widthHeight={iconSize}
                                  />}
                            label="Quick flag mode"
                            disabled={!canUseActions}
                            onClick={onToggleQuickFlag}
                            active={quickFlag}
                            style={{width: buttonSize}}
                    />
                    <ActionButton
                            icon={
                                <DragAFlagIcon
                                        widthHeight={iconSize}
                                />}
                            label="Drag-a-Flag"
                            disabled={!canUseActions}
                            draggable={!!canUseActions}
                            onDragStart={handleDragStart}
                            onDragEnd={() => {}}
                            onClick={() => {}}
                            style={{width: buttonSize}}
                    />
                </div>
            </>
    );
}

export default ActionBar;
