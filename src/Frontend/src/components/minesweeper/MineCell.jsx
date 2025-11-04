import React, { useRef, useMemo, useCallback } from "react";
import colors from "../../Colors";
import unopenedCellTexture from '../../assets/minesweeper/UnopenedCellTexture.svg';
import flaggedCellTexture from '../../assets/minesweeper/FlaggedCellTexture.svg';
import flaggingModeCellTexture from '../../assets/minesweeper/FlaggingModeCellTexture.svg';
import mineIcon from '../../assets/minesweeper/Mine.svg';

const numberColors = {
    1: "#60A5FA",
    2: "#22C55E",
    3: "#F43F5E",
    4: "#A78BFA",
    5: "#F59E0B",
    6: "#10B981",
    7: "#78350F",
    8: "#B91C1C",
};

function MineCell({
                      r, c,
                      isOpen, adj, isFlagged, isMine, lostOn,
                      isHighlighted, inHintRect,
                      size, quickFlagEnabled = false,
                      isFlaggable = false,
                      isRevealable = true,
                      isPermaFlagged = false,
                      onReveal, onFlag, onBeginHold, onEndHold,
                      onFlagDragStart, onFlagDrop
                  }) {
    const holdTimer = useRef(null);

    const baseCell = {
        position: "relative",
        width: size,
        height: size,
        borderRadius: 6,
        userSelect: "none",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        transition: "all 0.1s ease-in-out",
    };

    const unopenedStyle = {
        ...baseCell,
        backgroundImage: `url(${unopenedCellTexture})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "inset -1px -1px 0 rgba(0,0,0,0.45), inset 1px 1px 0 rgba(255,255,255,0.15)",
    };

    const openedStyle = {
        ...baseCell,
        backgroundColor: colors.secondary,
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "inset 0 0 2px rgba(255,255,255,0.1)",
    };

    const numberStyle = {
        fontSize: Math.max(12, Math.floor(size * 0.55)),
        fontWeight: 800,
        color: numberColors[adj] || colors.text_header,
        textShadow: "0 0 3px rgba(0,0,0,0.6)",
        lineHeight: 1,
    };

    const flaggedCellStyle = {
        ...baseCell,
        backgroundImage: `url(${flaggedCellTexture})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "inset -1px -1px 0 rgba(0,0,0,0.45), inset 1px 1px 0 rgba(255,255,255,0.15)",
    };

    const MineCellStyle = useMemo(() => ({
        ...baseCell,
        backgroundImage: `url(${mineIcon})`,
        backgroundSize: '60% 60%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "inset -1px -1px 0 rgba(0,0,0,0.45), inset 1px 1px 0 rgba(255,255,255,0.15)",
    }), [baseCell]);

    const flaggingModeCellStyle = {
        ...baseCell,
        backgroundImage: `url(${flaggingModeCellTexture})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "inset -1px -1px 0 rgba(0,0,0,0.45), inset 1px 1px 0 rgba(255,255,255,0.15)",
    };

    // === efekty ===
    const hintRing = inHintRect ? {
        outline: "2px solid rgba(255,255,255,0.3)",
        outlineOffset: -2,
    } : null;

    const holdRing = isHighlighted ? {
        boxShadow: "0 0 0 2px rgba(255,255,255,0.4), inset 0 0 0 2px rgba(255,255,255,0.2)",
    } : null;

    const lostOverlay = lostOn ? {
        background: "linear-gradient(180deg, rgba(255,33,33,0.15), rgba(255,33,33,0.05))",
        boxShadow: "inset 0 0 0 2px rgba(255,33,33,0.3)",
    } : null;

    // === interakce ===
    function handleLeftClick() {
        if (!isRevealable || isOpen || isFlagged || isPermaFlagged) return;
        onReveal?.(r, c);
    }

    function handleRightClick(e) {
        e.preventDefault();
        if (!isFlaggable || isOpen || isPermaFlagged) return;
        onFlag?.(r, c, !isFlagged);
    }

    function handleClick() {
        if (quickFlagEnabled) {
            if (!isFlaggable || isOpen || isPermaFlagged) return;
            onFlag?.(r, c, !isFlagged);
        } else {
            handleLeftClick();
        }
    }

    function clearHoldTimer() {
        if (holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
        }
    }

    function handleMouseDown(e) {
        if (e.button !== 0) return;
        clearHoldTimer();
        holdTimer.current = setTimeout(() => {
            onBeginHold?.(r, c);
            holdTimer.current = null;
        }, 350);
    }

    function handleMouseUp() {
        if (holdTimer.current) {
            clearHoldTimer();
        } else {
            onEndHold?.();
        }
    }

    function handleMouseLeave() {
        if (holdTimer.current) clearHoldTimer();
    }

    // === drag & drop (vlajky) ===
    const draggable = isFlagged && !isOpen;
    function onDragStart(e) {
        if (!draggable) return;
        e.dataTransfer.setData("text/plain", JSON.stringify({ r, c }));
        onFlagDragStart?.(r, c);
    }
    function onDragOver(e) { e.preventDefault(); }
    function onDrop(e) {
        const txt = e.dataTransfer.getData("text/plain");
        try {
            const { r: fr, c: fc } = JSON.parse(txt || "{}");
            if (Number.isInteger(fr) && Number.isInteger(fc)) {
                onFlagDrop?.(fr, fc, r, c);
            }
        } catch { }
    }

    // === výsledný styl ===
    const style = isOpen
                  ? { ...openedStyle, ...hintRing, ...holdRing, ...lostOverlay }
                  : { ...unopenedStyle, ...hintRing, ...holdRing };

    // === obsah buňky ===
    const content = (() => {
        if (isOpen) {
            if (isMine) {
                return <span style={MineCellStyle}></span>;
            }
            if (adj > 0) {
                return <span style={numberStyle}>{adj}</span>;
            }
            return null;
        }

        if (isFlagged) {
            return <span style={flaggedCellStyle}></span>;
        }

        if (quickFlagEnabled) {
            return <span style={flaggingModeCellStyle}></span>;
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
                    draggable={draggable}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onMouseEnter={(e) => {
                        if (!isOpen) e.currentTarget.style.border = "1px solid rgba(255,255,255,0.35)";
                    }}
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
            prev.size === next.size
    );
}

export default React.memo(MineCell, areEqual);
