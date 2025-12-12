import React, {useMemo, useRef} from "react";
import colors from "../../../Colors";
import MineCell from "./MineCell";
import HintOverlay from "./HintOverlay";

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
                      hintRectangle = null,
                      highlightCell = null,

                      /* Mutability */
                      holdHighlight = true,
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
                      onEndHold
                  }) {
    // References
    const gridRef = useRef(null);

    // Process the board state to render
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
        if(!highlightCell || !holdHighlight || isPaused) {
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

    // Game board styles
    const framePadding = 5;

    const outerFrameStyle = {
        alignSelf: "center",
        display: "inline-block",
        border: `3px solid ${colors.text_header}`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
        borderRadius: 5,
        overflow: "hidden"
    };

    const innerFrameStyle = {
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


    // Drag-a-Flag helpers
    function onGridDrop(event) {
        event.preventDefault();
    }

    function allowDrop(event) {
        event.preventDefault();
    }

    return (
            <div style={outerFrameStyle}>
                <div style={innerFrameStyle}>
                    <div
                            ref={gridRef}
                            style={gridStyle}
                            onDragOver={allowDrop}
                            onDrop={onGridDrop}
                            onContextMenu={(event) => event.preventDefault()}
                    >
                        <HintOverlay
                                hintRectangle={hintRectangle}
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
                            const inHint = !!hintRectangle && row >= hintRectangle.rowStart && row <= hintRectangle.rowEnd && col >= hintRectangle.colStart && col <= hintRectangle.colEnd;
                            const isPermaFlagged = permanentFlags.has(key);

                            // Cell interactivity according to spec:
                            let isFlaggable;
                            let isRevealable;
                            let isHoverable;

                            // Opened cells: cannot flag or reveal again and no hover effect
                            if(isOpen) {
                                isFlaggable = false;
                                isRevealable = false;
                                isHoverable = false;
                            }
                            // During explosion (with lives remaining): all interactions blocked
                            else if(isPaused) {
                                isFlaggable = false;
                                isRevealable = false;
                                isHoverable = false;
                            }
                            // Before first reveal: can only reveal, cannot flag, hovering active
                            else if(beforeStart) {
                                isFlaggable = false;
                                isRevealable = true;
                                isHoverable = true;
                            }
                            // Normal gameplay: all interactions allowed
                            else {
                                isFlaggable = true;
                                isRevealable = true;
                                isHoverable = true;
                            }

                            return (
                                    <MineCell
                                            // General parameters
                                            key={key}
                                            row={row}
                                            col={col}
                                            adjacent={adjacent}
                                            size={cellSize}

                                            // Cell state
                                            isOpen={isOpen}
                                            isFlagged={isFlagged}
                                            isPermaFlagged={isPermaFlagged}
                                            isMine={isMine}
                                            isLostOn={lostOnCell}

                                            // Special states
                                            isHighlighted={isHighlighted}
                                            inHintRectangle={inHint}

                                            // Cell mutability
                                            isFlaggable={isFlaggable}
                                            isRevealable={isRevealable}
                                            isHoverable={isHoverable}

                                            // Action mode
                                            quickFlagEnabled={quickFlag}

                                            // Action hooks
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
            </div>
    );
}

export default MineGrid;
