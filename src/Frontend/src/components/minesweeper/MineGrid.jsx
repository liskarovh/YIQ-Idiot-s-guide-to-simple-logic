import React, {useMemo, useRef} from "react";
import MineCell from "./MineCell";
import HintOverlay from "./HintOverlay";

function MineGrid({
                      /* Coordinates */
                      rows,
                      cols,

                      /* State */
                      opened = [],
                      flagged = [],
                      lostOn,
                      mines = [],

                      /* Highlighting */
                      hintRect,
                      highlightCell = null,

                      /* Mutability */
                      quickFlag = false,
                      isPaused = false,

                      /* Sizing */
                      cellSize = 28,
                      gap = 4,

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

    // highlightKeys se teď počítá z prop `highlightCell` a pouze pokud je cílová buňka opravdu odkrytá
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

    // Formátované logování: nejprve přehledná tabulka (grid), pak detailní seznam buněk
    try {
        const matrix = [];
        const details = [];

        for(let r = 0; r < rows; r++) {
            const rowObj = {};
            for(let c = 0; c < cols; c++) {
                const key = `${r},${c}`;
                const isOpen = openedMap.has(key);
                const adj = openedMap.get(key) ?? 0;
                const isFlagged = flaggedSet.has(key);
                const lostOnCell = !!(lostOn && lostOn.r === r && lostOn.c === c);
                const isHighlighted = highlightKeys.has(key);
                const isMine = mineSet.has(key);
                const inHint = !!hintRect && r >= hintRect.r0 && r <= hintRect.r1 && c >= hintRect.c0 && c <= hintRect.c1;

                // krátká reprezentace pro grid: O# = open with adj, F = flag, · = closed
                let short;
                if(isOpen) {
                    short = `O${adj}`;
                }
                else if(isFlagged) {
                    short = "F";
                }
                else {
                    short = "·";
                }

                // přidej vizuální markery
                if(isHighlighted) {
                    short = `*${short}`;
                }
                if(inHint) {
                    short = `${short}H`;
                }
                if(lostOnCell) {
                    short = `${short}!`;
                }

                rowObj[`c${c}`] = short;

                details.push({
                                 r, c,
                                 key,
                                 isOpen,
                                 adj,
                                 isFlagged,
                                 isMine,
                                 lostOn: lostOnCell,
                                 highlighted: isHighlighted,
                                 inHintRect: inHint
                             });
            }
            matrix.push(rowObj);
        }

        console.groupCollapsed("[MineGrid] grid view");
        console.log(`size: ${rows}x${cols}, opened: ${opened.length}, flagged: ${flagged.length}, minesKnown: ${mines?.length ?? 0}`);
        console.table(matrix);
        console.groupCollapsed("[MineGrid] cell details");
        console.table(details);
        console.groupEnd();
        console.groupEnd();
    }
    catch(e) {
        // logging must never crash render
        console.error("[MineGrid] logging error", e);
    }

    return (
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

                        return (
                                <MineCell
                                        key={key}
                                        r={r}
                                        c={c}
                                        isOpen={isOpen}
                                        adj={adj}
                                        isFlagged={isFlagged}
                                        isMine={isMine}
                                        lostOn={lostOnCell}
                                        isHighlighted={isHighlighted}
                                        inHintRect={inHint}
                                        size={cellSize}
                                        quickFlagEnabled={quickFlag}
                                        isFlaggable={!isPaused}
                                        isRevealable={!isPaused}
                                        isPermaFlagged={false}
                                        onReveal={onReveal}
                                        onFlag={onFlag}
                                        onBeginHold={onBeginHold}
                                        onEndHold={onEndHold}
                                        onFlagDragStart={() => {}}
                                        onFlagDrop={(fr, fc, tr, tc) => onMoveFlag?.(fr, fc, tr, tc)}
                                />);
                    })}
                </div>
            </div>);
}

export default MineGrid;
