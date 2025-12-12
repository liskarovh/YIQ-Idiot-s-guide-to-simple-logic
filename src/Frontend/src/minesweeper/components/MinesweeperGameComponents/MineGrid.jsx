import React, {useMemo, useRef} from "react";
import colors from "../../../Colors";
import MineCell from "./MineCell";
import HintOverlay from "./HintOverlay";
import AutoScale from "../../../components/AutoScale";

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
                      hintRectangle,
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
        const map = new Map();
        for(const {row, col, adjacent} of opened) {
            map.set(`${row},${col}`, adjacent);
        }
        return map;
    }, [opened]);

    const flaggedSet = useMemo(() => {
        const set = new Set();
        for(const {row, col} of flagged) {
            set.add(`${row},${col}`);
        }
        return set;
    }, [flagged]);

    const mineSet = useMemo(() => {
        const set = new Set();
        for(const mine of mines || []) {
            set.add(`${mine.row},${mine.col}`);
        }
        return set;
    }, [mines]);

    const highlightKeys = useMemo(() => {
        if(!highlightCell || !holdHighlight) {
            return new Set();
        }
        const {row, col} = highlightCell;
        if(!openedMap.has(`${row},${col}`)) {
            return new Set();
        }
        const keys = new Set();
        for(let deltaRow = -1; deltaRow <= 1; deltaRow++) {
            for(let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                const resultRow = row + deltaRow,
                        resultCol = col + deltaCol;
                if(resultRow >= 0 && resultRow < rows && resultCol >= 0 && resultCol < cols) {
                    keys.add(`${resultRow},${resultCol}`);
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
                        alignSelf: "flex-start",
                        display: "inline-block",
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
                                rect={hintRectangle}
                                cellSize={cellSize}
                                gap={gap}
                        />

                        {Array.from({length: rows * cols}, (_, idx) => {
                            const row = Math.floor(idx / cols);
                            const col = idx % cols;
                            const key = `${row},${col}`;
                            const isOpen = openedMap.has(key);
                            const adjacent = openedMap.get(key) ?? 0;
                            const isFlagged = flaggedSet.has(key);
                            const lostOnCell = !!(lostOn && lostOn.row === row && lostOn.col === col);
                            const isHighlighted = highlightKeys.has(key);
                            const isMine = mineSet.has(key);
                            const inHint = !!hintRectangle && row >= hintRectangle.r0 && row <= hintRectangle.r1 && col >= hintRectangle.c0 && col <= hintRectangle.c1;
                            const isPermaFlagged = permanentFlags.has(key);

                            // Cell interactivity according to spec:
                            let isFlaggable,
                                    isRevealable;

                            if(isOpen) {
                                // Opened cells: cannot flag or reveal again
                                isFlaggable = false;
                                isRevealable = false;
                            }
                            else if(isPaused) {
                                // During explosion (with lives remaining): all interactions blocked
                                isFlaggable = false;
                                isRevealable = false;
                            }
                            else if(beforeStart) {
                                // Before first reveal: can only reveal, cannot flag
                                isFlaggable = false;
                                isRevealable = true;
                            }
                            else {
                                // Normal gameplay: all interactions allowed
                                isFlaggable = true;
                                isRevealable = true;
                            }

                            return (
                                    <MineCell
                                            key={key}
                                            row={row}
                                            col={col}
                                            isOpen={isOpen}
                                            adjacent={adjacent}
                                            isFlagged={isFlagged}
                                            isPermaFlagged={isPermaFlagged}
                                            isMine={isMine}
                                            lostOn={lostOnCell}
                                            isHighlighted={isHighlighted}
                                            inhintRectangle={inHint}
                                            size={cellSize}
                                            quickFlagEnabled={quickFlag}
                                            isFlaggable={isFlaggable}
                                            isRevealable={isRevealable}
                                            onReveal={onReveal}
                                            onFlag={onFlag}
                                            onBeginHold={onBeginHold}
                                            onEndHold={onEndHold}
                                            onFlagDragStart={() => {}}
                                            onFlagDrop={(fromRow, fromCol, toRow, toCol) => onMoveFlag?.(fromRow, fromCol, toRow, toCol)}
                                    />);
                        })}
                    </div>
                </div>
            </AutoScale>
    );
}

export default MineGrid;
