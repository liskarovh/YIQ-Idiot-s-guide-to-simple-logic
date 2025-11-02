import React, {useRef} from "react";
import colors from "../../Colors";

const numberColors = {
    1: "#60A5FA",
    2: "#22C55E",
    3: "#F43F5E",
    4: "#A78BFA",
    5: "#F59E0B",
    6: "#10B981",
    7: "#FB923C",
    8: "#94A3B8"
};

function MineCell({
                      r, c,
                      isOpen,
                      adj = 0,
                      isFlagged = false,
                      isMine = false,
                      lostOn = false,
                      quickFlag = false,
                      isHighlighted = false,
                      inHintRect = false,
                      size = 28,
                      onReveal,
                      onFlag,
                      onBeginHold,
                      onEndHold,
                      onFlagDragStart,
                      onFlagDrop
                  }) {
    const holdTimer = useRef(null);

    const baseTile = {
        position: "relative",
        width: size,
        height: size,
        borderRadius: 6,
        userSelect: "none",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.2)"
    };

    const unopenedStyle = {
        ...baseTile,
        background: "linear-gradient(180deg, rgba(148,163,184,0.25), rgba(30,41,59,0.35))"
    };

    const openedStyle = {
        ...baseTile,
        background: "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(2,6,23,0.85))",
        border: "1px solid rgba(255,255,255,0.12)"
    };

    const numberStyle = {
        fontSize: Math.max(12, Math.floor(size * 0.55)),
        fontWeight: 800,
        color: numberColors[adj] || colors.text,
        lineHeight: 1
    };

    const flagGlyph = {
        fontSize: Math.floor(size * 0.7),
        lineHeight: 1
    };
    const mineGlyph = {
        fontSize: Math.floor(size * 0.6),
        lineHeight: 1
    };

    const hintRing = inHintRect ? {
        outline: "2px solid rgba(255,255,255,0.25)",
        outlineOffset: -2
    } : null;

    const holdRing = isHighlighted ? {
        boxShadow: "0 0 0 2px rgba(255,255,255,0.35), inset 0 0 0 2px rgba(255,255,255,0.2)"
    } : null;

    const lostOverlay = lostOn ? {
        background: "linear-gradient(180deg, rgba(255,33,33,0.15), rgba(255,33,33,0.05))",
        boxShadow: "inset 0 0 0 2px rgba(255,33,33,0.35), inset 1px 1px 0 rgba(255,255,255,0.05)"
    } : null;

    function handleClick(e) {
        e.preventDefault();
        if(quickFlag) {
            onFlag?.(r, c);
        }
        else {
            onReveal?.(r, c);
        }
    }

    function handleContextMenu(e) {
        e.preventDefault();
        onFlag?.(r, c);
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
            onBeginHold?.(r, c);
            holdTimer.current = null;
        }, 350);
    }

    function handleMouseUp() {
        if(holdTimer.current) {
            clearHoldTimer();
        }
        else {
            onEndHold?.();
        }
    }

    function handleMouseLeave() {
        if(holdTimer.current) {
            clearHoldTimer();
        }
    }

    // Drag-a-flag
    const draggable = isFlagged && !isOpen;

    function onDragStart(e) {
        if(!draggable) {
            return;
        }
        e.dataTransfer.setData("text/plain", JSON.stringify({r, c}));
        onFlagDragStart?.(r, c);
    }

    function onDragOver(e) { e.preventDefault(); }

    function onDrop(e) {
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

    const style = isOpen ? {...openedStyle, ...hintRing, ...holdRing, ...lostOverlay} : {...unopenedStyle, ...hintRing, ...holdRing};

    const content = (() => {
        if(isOpen) {
            if(isMine) {
                return <span
                        style={mineGlyph}>💣</span>;
            }
            if(adj > 0) {
                return <span
                        style={numberStyle}>{adj}</span>;
            }
            return null;
        }

        if(isFlagged) {
            return <span
                    style={flagGlyph}>🚩</span>;
        }

        return null;
    })();

    return (
            <div
                    style={style}
                    role="button"
                    aria-label={`cell-${r}-${c}`}
                    onClick={handleClick}
                    onContextMenu={handleContextMenu}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    draggable={draggable}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
            >
                {content}
            </div>
    );
}

export default MineCell;
