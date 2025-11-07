import React, {useMemo, useRef} from "react";
import colors from "../../Colors";
import MineCell from "./MineCell";
import HintOverlay from "./HintOverlay";
import AutoScale from "../AutoScale";

function MineGrid({
                      /* Coordinates */
                      rows,
                      cols,

                      /* State */
                      opened = [],
                      flagged = [],
                      permanentFlags = new Set(),
                      lostOn,
                      mines = [],

                      /* Highlighting */
                      hintRect,
                      highlightCell = null,

                      /* Mutability */
                      quickFlag = false,
                      isPaused = false,
                      beforeStart = false,

                      /* Sizing */
                      cellSize = 30,
                      gap = 3,

                      /* Callbacks */
                      onReveal,
                      onFlag,
                      onMoveFlag,
                      onBeginHold,
                      onEndHold,
                      holdHighlight = true
                  }) {

    const openedMap = useMemo(() => {
        const m = new Map();
        for(const {r, c, adj} of opened) {
            m.set(`${r},${c}`, adj);
        }
        return m;
    }, [opened]);

    const flaggedSet = useMemo(() => {
        const s = new Set();
        for(const {r, c} of flagged) {
            s.add(`${r},${c}`);
        }
        return s;
    }, [flagged]);

    const mineSet = useMemo(() => {
        const s = new Set();
        for(const m of mines || []) {
            s.add(`${m.r},${m.c}`);
        }
        return s;
    }, [mines]);

    const highlightKeys = useMemo(() => {
        if(!highlightCell || !holdHighlight) {
            return new Set();
        }
        const {r, c} = highlightCell;
        if(!openedMap.has(`${r},${c}`)) {
            return new Set();
        }
        const keys = new Set();
        for(let dr = -1; dr <= 1; dr++) {
            for(let dc = -1; dc <= 1; dc++) {
                const rr = r + dr,
                        cc = c + dc;
                if(rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
                    keys.add(`${rr},${cc}`);
                }
            }
        }
        return keys;
    }, [highlightCell, openedMap, rows, cols, holdHighlight]);

    const framePadding = 5;

    const frameStyle = {
        position: "relative",
        display: "grid",
        placeItems: "center",
        padding: framePadding,
        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
        boxSizing: "border-box"
    };

    const gridStyle = {
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap
    };

    const gridWidth = cols * cellSize + Math.max(0, cols - 1) * gap;
    const gridHeight = rows * cellSize + Math.max(0, rows - 1) * gap;
    const baseWidth = gridWidth + framePadding * 2;
    const baseHeight = gridHeight + framePadding * 2;

    const gridRef = useRef(null);

    function onGridDrop(e) { e.preventDefault(); }

    function allowDrop(e) { e.preventDefault(); }

    return (
            <AutoScale
                    baseWidth={baseWidth}
                    baseHeight={baseHeight}
                    center={false}
                    minScale={0.5}
                    maxScale={1}
                    style={{
                        alignSelf: 'flex-start',
                        display: 'inline-block',
                        border: `3px solid ${colors.text_header}`,
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
                        borderRadius: 5,
                        overflow: "hidden"
                    }}
            >
                <div style={frameStyle}>
                    <div
                            ref={gridRef}
                            style={gridStyle}
                            onDragOver={allowDrop}
                            onDrop={onGridDrop}
                            onContextMenu={(e) => e.preventDefault()}
                    >
                        <HintOverlay
                                rect={hintRect}
                                cellSize={cellSize}
                                gap={gap}
                        />

                        {Array.from({length: rows * cols}, (_, idx) => {
                            const r = Math.floor(idx / cols);
                            const c = idx % cols;
                            const key = `${r},${c}`;
                            const isOpen = openedMap.has(key);
                            const adj = openedMap.get(key) ?? 0;
                            const isFlagged = flaggedSet.has(key);
                            const lostOnCell = !!(lostOn && lostOn.r === r && lostOn.c === c);
                            const isHighlighted = highlightKeys.has(key);
                            const isMine = mineSet.has(key);
                            const inHint = !!hintRect && r >= hintRect.r0 && r <= hintRect.r1 && c >= hintRect.c0 && c <= hintRect.c1;
                            const isPermaFlagged = permanentFlags.has(key);

                            // Cell interactivity according to spec:
                            let isFlaggable, isRevealable;

                            if (isOpen) {
                                // Opened cells: cannot flag or reveal again
                                isFlaggable = false;
                                isRevealable = false;
                            } else if (isPaused) {
                                // During explosion (with lives remaining): all interactions blocked
                                isFlaggable = false;
                                isRevealable = false;
                            } else if (beforeStart) {
                                // Before first reveal: can only reveal, cannot flag
                                isFlaggable = false;
                                isRevealable = true;
                            } else {
                                // Normal gameplay: all interactions allowed
                                isFlaggable = true;
                                isRevealable = true;
                            }

                            return (
                                    <MineCell
                                            key={key}
                                            r={r}
                                            c={c}
                                            isOpen={isOpen}
                                            adj={adj}
                                            isFlagged={isFlagged}
                                            isPermaFlagged={isPermaFlagged}
                                            isMine={isMine}
                                            lostOn={lostOnCell}
                                            isHighlighted={isHighlighted}
                                            inHintRect={inHint}
                                            size={cellSize}
                                            quickFlagEnabled={quickFlag}
                                            isFlaggable={isFlaggable}
                                            isRevealable={isRevealable}
                                            onReveal={onReveal}
                                            onFlag={onFlag}
                                            onBeginHold={onBeginHold}
                                            onEndHold={onEndHold}
                                            onFlagDragStart={() => {}}
                                            onFlagDrop={(fr, fc, tr, tc) => onMoveFlag?.(fr, fc, tr, tc)}
                                    />);
                        })}
                    </div>
                </div>
            </AutoScale>
    );
}

export default MineGrid;
