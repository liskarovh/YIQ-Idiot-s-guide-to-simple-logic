/**
 * @file Game layout component for Minesweeper game.
 * @brief This component manages the layout of the Minesweeper game,
 *        including responsive design for narrow and wide screens.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React, {useRef, useState, useLayoutEffect, cloneElement} from "react";
import Header from "../../../components/Header";
import Banner from "../../../components/Banner";
import MinesweeperGameStyles from "../../styles/MinesweeperGameStyles.jsx";

function GameLayout({
                        onSettings,
                        statisticsArea,
                        boardArea,
                        actionsArea,
                        error
                    }) {
    const hasLeft = !!statisticsArea;

    // Narrow state management
    const containerRef = useRef(null);
    const [isNarrow, setIsNarrow] = useState(false);

    // Measure container width and update isNarrow state
    useLayoutEffect(() => {
        if(!hasLeft) {
            return;
        }

        // Get container element
        const containerElement = containerRef.current;
        if(!containerElement) {
            return;
        }

        // Define thresholds
        const NARROW_THRESHOLD_DOWN = 850;
        const NARROW_THRESHOLD_UP = 900;

        // Resize observer setup
        let rafId = null;
        const update = () => {
            rafId = null;
            const containerWidth = containerElement.getBoundingClientRect().width || 0;

            // Update isNarrow state with hysteresis (up/down thresholds)
            setIsNarrow(previous => {
                let narrow;
                if(previous) {
                    narrow = containerWidth < NARROW_THRESHOLD_UP;
                }
                else {
                    narrow = containerWidth < NARROW_THRESHOLD_DOWN;
                }

                return narrow;
            });
        };

        // Schedule update using requestAnimationFrame
        const scheduleUpdate = () => {
            if(rafId) {
                return;
            }
            rafId = requestAnimationFrame(update);
        };

        // Create and observe resize observer
        const resizeObserver = new ResizeObserver(scheduleUpdate);
        resizeObserver.observe(containerElement);

        // Schedule initial update
        scheduleUpdate();

        return () => {
            // Cleanup on unmount
            resizeObserver.disconnect();
            if(rafId) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [hasLeft]);

    // Clone statistics area with additional props if it exists
    const statisticsAreaNode = hasLeft ? cloneElement(
            statisticsArea,
            {
                forceTwoColumns: isNarrow,
                columnGap: isNarrow ? "clamp(20px, 4vw, 32px)" : undefined
            }
    ) : null;

    // Header component
    const header = (
            <Header
                    rightLinkTitle={"Settings"}
                    showBack={false}
                    onNavigate={onSettings}
            />
    );

    // Statistics area style with conditional adjustments for narrow layout
    const statisticsAreaStyle = {
        ...MinesweeperGameStyles.statisticsAreaLeft,
        ...(isNarrow ? {
            alignItems: "center",
            maxWidth: "100%",
            textAlign: "center",
            justifyContent: "flex-start"
        } : {})
    };

    // Render layout based on narrow state and presence of left statistics area
    if(isNarrow || !hasLeft) {
        return (
                <div style={MinesweeperGameStyles.contentStyle}>
                    {header}

                    <div ref={containerRef}
                         style={{
                             display: "flex",
                             flexDirection: "column",
                             gap: "clamp(1rem, 3vw, 2rem)",
                             padding: "0rem 1rem 0rem 2rem",
                             minHeight: "calc(100vh - 7.5rem)",
                             boxSizing: "border-box"
                         }}
                    >
                        {hasLeft && (
                                <div style={MinesweeperGameStyles.statisticsAreaAbove}>
                                    {statisticsAreaNode}
                                </div>
                        )}

                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: "1 1 auto",
                            minHeight: 0,
                            gap: "1rem"
                        }}
                        >
                            {boardArea}
                            <div style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center"
                            }}
                            >
                                {actionsArea}
                            </div>
                        </div>
                    </div>
                    <div style={MinesweeperGameStyles.errorWrap}>
                        <Banner type={"error"}
                                error={error}
                        />
                    </div>
                </div>
        );
    }

    // Regular layout with left statistics area
    return (
            <div style={MinesweeperGameStyles.contentStyle}>
                {header}

                <div ref={containerRef}
                     style={{
                         ...MinesweeperGameStyles.boxLayoutStyle,
                         minHeight: "calc(100vh - 7.5rem)",
                         gridTemplateRows: "minmax(0, 1fr) auto",
                         alignItems: "stretch"
                     }}
                >
                    <div style={{
                        ...statisticsAreaStyle,
                        minWidth: "clamp(260px, 22vw, 360px)",
                        maxWidth: "clamp(360px, 28vw, 420px)",
                        gridColumn: "1",
                        gridRow: "1",
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                    >
                        {statisticsAreaNode}
                    </div>

                    <div style={{
                        ...MinesweeperGameStyles.rightPanel,
                        gridColumn: "2",
                        gridRow: "1",
                        minHeight: 0
                    }}
                    >
                        {boardArea}
                    </div>

                    <div style={{
                        gridColumn: "2",
                        gridRow: "2",
                        width: "100%",
                        padding: "0 12px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                    >
                        {actionsArea}
                    </div>
                </div>
                <div style={MinesweeperGameStyles.errorWrap}>
                    <Banner type={"error"}
                            error={error}
                    />
                </div>
            </div>
    );
}

export default GameLayout;
