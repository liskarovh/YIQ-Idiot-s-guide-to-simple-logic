import React, {useRef, useMemo, useState, memo} from "react";
import colors from "../../../Colors";
import {useImageUrl} from "../../../hooks/RenderImage";
import {UnopenedCellTexture} from "../../../assets/minesweeper/UnopenedCellTexture";
import {FlaggedCellTexture} from "../../../assets/minesweeper/FlaggedCellTexture";
import {FlaggingModeCellTexture} from "../../../assets/minesweeper/FlaggingModeCellTexture";
import {Mine} from "../../../assets/minesweeper/Mine";

const numberColors = {
    1: "#60A5FA",
    2: "#22C55E",
    3: "#F43F5E",
    4: "#A78BFA",
    5: "#F59E0B",
    6: "#10B981",
    7: "#78350F",
    8: "#B91C1C"
};

function MineCell({
                      // General parameters
                      row,
                      col,
                      adjacent = 0,
                      size,

                      // Cell state
                      isOpen = false,
                      isFlagged = false,
                      isPermaFlagged = false,
                      isMine = false,
                      isLostOn = false,

                      // Special states
                      isHighlighted = false,
                      inHintRectangle = false,

                      // Cell mutability
                      isFlaggable = true,
                      isRevealable = true,
                      isHoverable = true,

                      // Action mode
                      quickFlagEnabled = false,

                      // Action hooks
                      onReveal,
                      onFlag,
                      onBeginHold,
                      onEndHold,
                      onFlagDragStart,
                      onFlagDrop
                  }) {

    const holdTimer = useRef(null);
    const hoverTimer = useRef(null);
    const [hovered, setHovered] = useState(false);

    const unopenedUrl = useImageUrl(UnopenedCellTexture);
    const flaggedUrl = useImageUrl(FlaggedCellTexture);
    const flaggingModeUrl = useImageUrl(FlaggingModeCellTexture);
    const mineUrl = useImageUrl(Mine);

    const baseCell = {
        position: "relative",
        width: size,
        height: size,
        borderRadius: 5,
        userSelect: "none",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        willChange: "transform, box-shadow",
        boxSizing: "border-box",
        border: `1px solid rgba(255,255,255,0.7)`,
        boxShadow: "inset -1px -1px 0 rgba(0,0,0,0.45), inset 1px 1px 0 rgba(255,255,255,0.15)"
    };

    const unopenedStyle = {
        ...baseCell,
        backgroundImage: unopenedUrl ? `url(${unopenedUrl})` : "none",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center"
    };

    const openedStyle = {
        ...baseCell,
        backgroundColor: colors.secondary,
        border: `1px solid rgba(255,255,255,0.6)`,
        boxShadow: "inset 0 0 2px rgba(255,255,255,0.1)"
    };

    const numberStyle = {
        fontSize: Math.max(12, Math.floor(size * 0.55)),
        fontWeight: 800,
        color: numberColors[adjacent] || colors.text_header,
        textShadow: "0 0 3px rgba(0,0,0,0.6)",
        lineHeight: 1
    };

    const flaggedCellStyle = {
        ...baseCell,
        backgroundImage: flaggedUrl ? `url(${flaggedUrl})` : "none",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        // Permanent flags have golden glow
        boxShadow: isPermaFlagged
                   ? "0 0 12px rgba(255,215,0,0.8), inset -1px -1px 0 rgba(0,0,0,0.45), inset 1px 1px 0 rgba(255,255,255,0.15)"
                   : undefined
    };

    const MineCellStyle = useMemo(() => ({
        ...baseCell,
        backgroundImage: mineUrl ? `url(${mineUrl})` : "none",
        backgroundSize: "60% 60%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center"
    }), [baseCell, mineUrl]);

    const flaggingModeCellStyle = {
        ...baseCell,
        backgroundImage: flaggingModeUrl ? `url(${flaggingModeUrl})` : "none",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center"
    };

    // Special effect styles
    const hintRectangleStyle = inHintRectangle ? {
        boxShadow: "0 0 8px 3px rgba(96, 165, 250, 0.6), inset 0 0 8px rgba(96, 165, 250, 0.3)",
        border: "2px solid rgba(96, 165, 250, 0.9)",
    } : null; // TODO: change color when wifi is available to view pallete

    const highlightingRectangleStyle = isHighlighted ? {
        boxShadow: "0 0 8px 3px rgba(96, 165, 250, 0.6), inset 0 0 8px rgba(96, 165, 250, 0.3)",
        border: "2px solid rgba(96, 165, 250, 0.9)",
    } : null;

    // Lost on cells have special border (ti signal, they are perma-flagged)
    const lostOnStyle = isLostOn ? {
        background: "linear-gradient(180deg, rgba(255,33,33,0.12), rgba(255,33,33,0.04))",
        boxShadow: "inset 0 0 0 2px rgba(255,33,33,0.2)"
    } : null;

    // Subtle hover effect
    const hoverEffect = (!isOpen && hovered && isHoverable) ? {
        boxShadow: "0 6px 10px rgba(0,0,0,0.06)",
        transform: "translateZ(0) translateY(-0.5px)"
    } : null;

    // Actiion handlers
    function handleClick(event) {
        event.preventDefault();
        if(isOpen) {
            return;
        }

        // QuickFlag mode: only flagging
        if(quickFlagEnabled) {
            if(!isPermaFlagged && isFlaggable) {
                onFlag?.(row, col);
            }
            return;
        }

        // Classic mode: revealing has priority
        if(isRevealable && !isFlagged && !isPermaFlagged) {
            onReveal?.(row, col);
        }
    }

    function handleRightClick(event) {
        event.preventDefault();

        // Right click never works in QuickFlag mode or on opened cells
        if(quickFlagEnabled || isOpen || isPermaFlagged) {
            return;
        }

        // Can only flag if isFlaggable is true
        if(isFlaggable) {
            onFlag?.(row, col);
        }
    }

    function clearHoldTimer() {
        if(holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
        }
    }

    function handleMouseDown(event) {
        if(event.button !== 0) {
            return;
        }
        clearHoldTimer();

        holdTimer.current = setTimeout(() => {
            // Long press on OPENED cell -> highlight neighborhood
            if(isOpen) {
                onBeginHold?.(row, col);
            }
            // Long press on UNOPENED cell in classic mode -> flagging
            else if(!quickFlagEnabled && !isPermaFlagged && isFlaggable) {
                onFlag?.(row, col);
            }
            holdTimer.current = null;
        }, 350);
    }

    function handleMouseUp() {

        if(holdTimer.current) {
            clearHoldTimer();
        }
        else {
            onEndHold?.(row, col);
        }
    }

    // Debounced hover handlers - eliminate short transitions during fast mouse movement
    function handleMouseEnter() {
        if(hoverTimer.current) {
            clearTimeout(hoverTimer.current);
        }
        hoverTimer.current = setTimeout(() => {
            setHovered(true);
            hoverTimer.current = null;
        }, 50);
    }

    function handleMouseLeave() {
        if(hoverTimer.current) {
            clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
        }
        setHovered(false);
        if(holdTimer.current) {
            clearHoldTimer();
        }
        onEndHold?.(row, col);
    }

    // Drag & drop for flags - disabled for permanent flags
    const draggable = isFlagged && !isOpen && !isPermaFlagged;

    function onDragStart(e) {
        if(!draggable) {
            return;
        }
        e.dataTransfer.setData("text/plain", JSON.stringify({row, col}));
        onFlagDragStart?.(row, col);
    }

    function onDragOver(e) {
        e.preventDefault();
    }

    function onDrop(e) {
        e.preventDefault();
        const txt = e.dataTransfer.getData("text/plain");
        try {
            const {row: fromRow, col: fromCol} = JSON.parse(txt || "{}");
            if(Number.isInteger(fromRow) && Number.isInteger(fromCol)) {
                onFlagDrop?.(fromRow, fromCol, row, col);
            }
        }
        catch {
        }
    }

    // Final style (combine effects)
    const style = isOpen
                  ? {...openedStyle, ...lostOnStyle, ...hintRectangleStyle, ...highlightingRectangleStyle}
                  : {...unopenedStyle, ...hintRectangleStyle, ...highlightingRectangleStyle, ...hoverEffect};

    // Cell content
    const content = (() => {
        if(isOpen) {
            if(isMine) {
                return <span
                        style={MineCellStyle}
                />;
            }
            if(adjacent > 0) {
                return <span
                        style={numberStyle}
                >{adjacent}</span>;
            }
            return null;
        }

        if(isFlagged) {
            return <span
                    style={flaggedCellStyle}
            />;
        }

        if(quickFlagEnabled) {
            return <span
                    style={flaggingModeCellStyle}
            />;
        }

        return null;
    })();

    return (
            <div
                    style={style}
                    role="button"
                    aria-label={`cell-${row}-${col}`}
                    onClick={handleClick}
                    onContextMenu={handleRightClick}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onMouseEnter={handleMouseEnter}
                    draggable={draggable}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
            >
                {content}
            </div>
    );
}

function areEqual(prev, next) {
    return (
            prev.isOpen === next.isOpen &&
            prev.adjacent === next.adjacent &&
            prev.isFlagged === next.isFlagged &&
            prev.isMine === next.isMine &&
            !!prev.lostOn === !!next.lostOn &&
            prev.quickFlagEnabled === next.quickFlagEnabled &&
            prev.isHighlighted === next.isHighlighted &&
            prev.inHintRectangle === next.inHintRectangle &&
            prev.size === next.size &&
            prev.isPermaFlagged === next.isPermaFlagged &&
            prev.isFlaggable === next.isFlaggable &&
            prev.isRevealable === next.isRevealable
    );
}

export default memo(MineCell, areEqual);
