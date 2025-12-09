import React, {useRef, useMemo, useState} from "react";
import colors from "../../../Colors";
import unopenedCellTexture from "../../../assets/minesweeper/UnopenedCellTexture.svg";
import flaggedCellTexture from "../../../assets/minesweeper/FlaggedCellTexture.svg";
import flaggingModeCellTexture from "../../../assets/minesweeper/FlaggingModeCellTexture.svg";
import mineIcon from "../../../assets/minesweeper/Mine.svg";

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
                      r, c,
                      isOpen = false,
                      adj = 0,
                      isFlagged = false,
                      isMine = false,
                      lostOn = false,
                      isHighlighted = false,
                      inHintRect = false,
                      size,
                      quickFlagEnabled = false,
                      isFlaggable = true,
                      isRevealable = true,
                      isPermaFlagged = false,
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
        backgroundImage: `url(${unopenedCellTexture})`,
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
        color: numberColors[adj] || colors.text_header,
        textShadow: "0 0 3px rgba(0,0,0,0.6)",
        lineHeight: 1
    };

    const flaggedCellStyle = {
        ...baseCell,
        backgroundImage: `url(${flaggedCellTexture})`,
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
        backgroundImage: `url(${mineIcon})`,
        backgroundSize: "60% 60%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center"
    }), [baseCell]);

    const flaggingModeCellStyle = {
        ...baseCell,
        backgroundImage: `url(${flaggingModeCellTexture})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center"
    };

    // Effects
    const hintRing = inHintRect ? {
        boxShadow: "0 0 0 2px rgba(255,255,255,0.06), inset -1px -1px 0 rgba(0,0,0,0.45)"
    } : null;

    const holdRing = isHighlighted ? {
        boxShadow: "0 0 0 2px rgba(255,255,255,0.14), inset 0 0 0 2px rgba(255,255,255,0.08)"
    } : null;

    const lostOverlay = lostOn ? {
        background: "linear-gradient(180deg, rgba(255,33,33,0.12), rgba(255,33,33,0.04))",
        boxShadow: "inset 0 0 0 2px rgba(255,33,33,0.2)"
    } : null;

    // Subtle hover effect (GPU accelerated)
    const hoverEffect = (!isOpen && hovered) ? {
        boxShadow: "0 6px 10px rgba(0,0,0,0.06)",
        transform: "translateZ(0) translateY(-0.5px)"
    } : {};

    // Interaction handlers according to spec
    function handleClick(e) {
        e.preventDefault();
        if(isOpen) {
            return;
        }

        // QuickFlag mode: only flagging (if allowed)
        if(quickFlagEnabled) {
            if(!isPermaFlagged && isFlaggable) {
                onFlag?.(r, c);
            }
            return;
        }

        // Classic mode: revealing has priority
        if(isRevealable && !isFlagged && !isPermaFlagged) {
            onReveal?.(r, c);
        }
    }

    function handleRightClick(e) {
        e.preventDefault();

        // Right click never works in QuickFlag mode or on opened cells
        if(quickFlagEnabled || isOpen || isPermaFlagged) {
            return;
        }

        // Can only flag if isFlaggable is true
        if(isFlaggable) {
            onFlag?.(r, c);
        }
    }

    function clearHoldTimer() {
        if(holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
        }
    }

    function handleMouseDown(e) {
        if(e.button !== 0) {
            return;
        }
        clearHoldTimer();

        holdTimer.current = setTimeout(() => {
            // Long press on OPENED cell -> highlight neighborhood
            if(isOpen) {
                onBeginHold?.(r, c);
            }
            // Long press on UNOPENED cell in classic mode -> flagging
            else if(!quickFlagEnabled && !isPermaFlagged && isFlaggable) {
                onFlag?.(r, c);
            }
            holdTimer.current = null;
        }, 350);
    }

    function handleMouseUp() {
        if(holdTimer.current) {
            clearHoldTimer();
        }
        else {
            onEndHold?.(r, c);
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
        onEndHold?.(r, c);
    }

    // Drag & drop for flags - disabled for permanent flags
    const draggable = isFlagged && !isOpen && !isPermaFlagged;

    function onDragStart(e) {
        if(!draggable) {
            return;
        }
        e.dataTransfer.setData("text/plain", JSON.stringify({r, c}));
        onFlagDragStart?.(r, c);
    }

    function onDragOver(e) {
        e.preventDefault();
    }

    function onDrop(e) {
        e.preventDefault();
        const txt = e.dataTransfer.getData("text/plain");
        try {
            const {r: fr, c: fc} = JSON.parse(txt || "{}");
            if(Number.isInteger(fr) && Number.isInteger(fc)) {
                onFlagDrop?.(fr, fc, r, c);
            }
        }
        catch {
        }
    }

    // Final style (combine effects)
    const style = isOpen
                  ? {...openedStyle, ...hintRing, ...holdRing, ...lostOverlay}
                  : {...unopenedStyle, ...hintRing, ...holdRing, ...hoverEffect};

    // Cell content
    const content = (() => {
        if(isOpen) {
            if(isMine) {
                return <span
                        style={MineCellStyle}
                />;
            }
            if(adj > 0) {
                return <span
                        style={numberStyle}
                >{adj}</span>;
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
                    aria-label={`cell-${r}-${c}`}
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
            prev.adj === next.adj &&
            prev.isFlagged === next.isFlagged &&
            prev.isMine === next.isMine &&
            !!prev.lostOn === !!next.lostOn &&
            prev.quickFlagEnabled === next.quickFlagEnabled &&
            prev.isHighlighted === next.isHighlighted &&
            prev.inHintRect === next.inHintRect &&
            prev.size === next.size &&
            prev.isPermaFlagged === next.isPermaFlagged &&
            prev.isFlaggable === next.isFlaggable &&
            prev.isRevealable === next.isRevealable
    );
}

export default React.memo(MineCell, areEqual);
