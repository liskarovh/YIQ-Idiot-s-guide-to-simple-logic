import React, {useCallback, useEffect, useMemo, useRef} from "react";
import colors from "../../../Colors";
import MineCell from "./MineCell";
import HintOverlay from "./HintOverlay";
import {useImageUrl} from "../../../hooks/RenderImage";
import {Flag} from "../../../assets/minesweeper/Flag";

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
                      onBeginHold,
                      onEndHold,

                      /* Keyboard mode */
                      focusedCell = null,
                      keyboardDragging = false,
                      cursorPosition = null,
                      onDropFlag,
                      onCursorInit
                  }) {
    // References
    const gridRef = useRef(null);
    const flagUrl = useImageUrl(Flag);

    // Initialize cursor position in keyboard dragging mode
    useEffect(() => {
        if(keyboardDragging && !cursorPosition && gridRef.current) {
            const rect = gridRef.current.getBoundingClientRect();
            const initialX = rect.width / 2;
            const initialY = rect.height / 2;

            onCursorInit?.({x: initialX, y: initialY});
        }
    }, [keyboardDragging, cursorPosition, onCursorInit]);

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
        padding: 5,
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
        event.stopPropagation();

        // We allow only drops with our custom flag MIME type
        const hasFlag = event.dataTransfer?.getData("application/x-drag-flag");
        if(!hasFlag) {
            return;
        }

        // Determine cell under cursor
        const element = gridRef.current;
        if(!element) {
            return;
        }

        // We need coordinates relative to the grid element
        const boundingRect = element.getBoundingClientRect();
        const x = event.clientX - boundingRect.left;
        const y = event.clientY - boundingRect.top;

        // Compute column/row using scaled/rendered sizes
        const cellWidthScaled = boundingRect.width / cols;
        const cellHeightScaled = boundingRect.height / rows;
        let col = Math.floor(x / cellWidthScaled);
        let row = Math.floor(y / cellHeightScaled);

        // We must clamp coordinates to valid range
        if(col < 0) {
            col = 0;
        }
        if(row < 0) {
            row = 0;
        }
        if(col >= cols) {
            col = cols - 1;
        }
        if(row >= rows) {
            row = rows - 1;
        }

        // Key of the target cell
        const key = `${row},${col}`;

        // If the cell is already opened, flagged, permanently flagged, or game is paused, ignore
        if(openedMap.has(key) || permanentFlags.has(key) || isPaused) {
            return;
        }

        // Call the flag callback to set a flag here
        onFlag?.(row, col, true);
    }

    function allowDrop(event) {
        event.preventDefault();
        try {
            event.dataTransfer.dropEffect = "copy";
        }
        catch {
            // ignore
        }
    }

    // Handle click to drop flag in keyboard dragging mode
    const handleGridClick = useCallback(() => {
        if(!keyboardDragging || !cursorPosition) {
            return;
        }

        const boundingRect = gridRef.current.getBoundingClientRect();
        const cellWidthScaled = boundingRect.width / cols;
        const cellHeightScaled = boundingRect.height / rows;

        let col = Math.floor(cursorPosition.x / cellWidthScaled);
        let row = Math.floor(cursorPosition.y / cellHeightScaled);

        col = Math.max(0, Math.min(cols - 1, col));
        row = Math.max(0, Math.min(rows - 1, row));

        const key = `${row},${col}`;

        // Check if cell is flaggable
        const isOpen = openedMap.has(key);
        const isPermaFlagged = permanentFlags.has(key);
        const isMineCell = mineSet.has(key);
        const lostOnCell = !!(lostOn && lostOn.row === row && lostOn.col === col);

        const isFlaggable = !isOpen && !isPaused && !isPermaFlagged &&
                            !(isMineCell && lostOnCell) && !beforeStart;

        if(isFlaggable) {
            onDropFlag?.(row, col, true);
        }
    }, [keyboardDragging, cursorPosition, cols, rows, openedMap, permanentFlags, mineSet, lostOn, isPaused, beforeStart, onDropFlag]);

    return (
            <div style={outerFrameStyle}>
                <div style={innerFrameStyle}>
                    <div
                            ref={gridRef}
                            style={gridStyle}
                            onClick={handleGridClick}
                            onDragOver={allowDrop}
                            onDrop={onGridDrop}
                            onContextMenu={(event) => event.preventDefault()}
                    >
                        <HintOverlay
                                hintRectangle={hintRectangle}
                                cellSize={cellSize}
                                gap={gap}
                        />

                        {keyboardDragging && cursorPosition && !beforeStart && (
                                <div
                                        style={{
                                            position: "absolute",
                                            left: Math.max(0, Math.min(cursorPosition.x, gridRef.current?.offsetWidth || cursorPosition.x)),
                                            top: Math.max(0, Math.min(cursorPosition.y, gridRef.current?.offsetHeight || cursorPosition.y)),
                                            width: 32,
                                            height: 32,
                                            transform: "translate(-50%, -50%)",
                                            backgroundImage: `url(${flagUrl})`,
                                            backgroundSize: "cover",
                                            pointerEvents: "none",
                                            zIndex: 1000,
                                            transition: "left 50ms ease-out, top 50ms ease-out",
                                            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
                                            opacity: 0.95
                                        }}
                                />
                        )}

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
                            const isFocused = !keyboardDragging && !!focusedCell && focusedCell.row === row && focusedCell.col === col;

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
                            // Permanently flagged cells: all interactions blocked
                            else if(isPermaFlagged) {
                                isFlaggable = false;
                                isRevealable = false;
                                isHoverable = false;
                            }
                            // Lost-on cell: all interactions blocked
                            else if(isMine && lostOnCell) {
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
                                            isFocused={isFocused}

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
                                    />);
                        })}
                    </div>
                </div>
            </div>
    );
}

export default MineGrid;
