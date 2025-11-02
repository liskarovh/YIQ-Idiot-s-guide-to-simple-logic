import React, {useMemo, useRef, useState} from "react";
import MineCell from "./MineCell";
import HintOverlay from "./HintOverlay";


function MineGrid({
                      rows,
                      cols,
                      opened = [],
                      flagged = [],
                      lostOn,
                      hintRect,
                      quickFlag = false,
                      cellSize = 28,
                      gap = 4,
                      onReveal,
                      onFlag,
                      onMoveFlag,
                      onBeginHold,
                      onEndHold
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

    // Long-press highlight (8-neighborhood)
    const [highlightKeys, setHighlightKeys] = useState(() => new Set());
    const computeNeighborhood = (r, c) => {
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
    };

    function handleBeginHold(r, c) {
        setHighlightKeys(computeNeighborhood(r, c));
        onBeginHold?.(r, c);
    }

    function handleEndHold() {
        setHighlightKeys(new Set());
        onEndHold?.();
    }

    const frameStyle = {
        position: "relative",
        display: "inline-block",
        padding: 8,
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.45)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
    };

    const gridStyle = {
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap
    };

    const gridRef = useRef(null);

    function onGridDrop(e) { e.preventDefault(); }

    function allowDrop(e) { e.preventDefault(); }

    return (
            <div style={frameStyle}>
                <div
                        ref={gridRef}
                        style={gridStyle}
                        onDragOver={allowDrop}
                        onDrop={onGridDrop}
                        onContextMenu={(e) => e.preventDefault()}
                >
                    {/* overlay (hint) */}
                    <HintOverlay
                            rect={hintRect}
                            cellSize={cellSize}
                            gap={gap} />

                    {/* cells */}
                    {Array.from({length: rows * cols}, (_, idx) => {
                        const r = Math.floor(idx / cols);
                        const c = idx % cols;
                        const key = `${r},${c}`;
                        const isOpen = openedMap.has(key);
                        const adj = openedMap.get(key) ?? 0;
                        const isFlagged = flaggedSet.has(key);
                        const lostOnCell = !!(lostOn && lostOn.r === r && lostOn.c === c);
                        const isHighlighted = highlightKeys.has(key);

                        return (
                                <MineCell
                                        key={key}
                                        r={r}
                                        c={c}
                                        isOpen={isOpen}
                                        adj={adj}
                                        isFlagged={isFlagged}
                                        lostOn={lostOnCell}
                                        isHighlighted={isHighlighted}
                                        inHintRect={!!hintRect && r >= hintRect.r0 && r <= hintRect.r1 && c >= hintRect.c0 && c <= hintRect.c1}
                                        size={cellSize}
                                        quickFlag={quickFlag}
                                        onReveal={onReveal}
                                        onFlag={onFlag}
                                        onBeginHold={handleBeginHold}
                                        onEndHold={handleEndHold}
                                        onFlagDragStart={() => {}}
                                        onFlagDrop={(fr, fc, tr, tc) => onMoveFlag?.(fr, fc, tr, tc)}
                                />
                        );
                    })}
                </div>
            </div>
    );
}

export default MineGrid;
