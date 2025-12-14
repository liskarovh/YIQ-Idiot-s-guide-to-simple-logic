const MinesweeperGameStyles = {
    // Page background and header spacing
    contentStyle: {
        padding: "7rem 1rem 0.5rem 0rem",
        minHeight: "100vh",
        boxSizing: "border-box"
    },

    // Outer shell that keeps content centered and adds a left offset from viewport
    boxLayoutStyle: {
        display: "grid",
        gridTemplateColumns: "clamp(240px, 20vw, 320px) minmax(auto, 1fr)",
        columnGap: "clamp(2rem, 1.8vw, 3rem)",
        rowGap: "1.5rem",
        padding: "0rem 1rem 0rem 2rem",
        alignItems: "center",
        boxSizing: "border-box"
    },

    // Right side that contains the board and controls
    rightPanel: {
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        minWidth: 0,
        minHeight: 0,
        overflow: "visible",
        flex: "1 1 auto"
    },

    // Error banner wrapper
    errorWrap: {
        marginTop: 16
    },

    // Statistics Area styles
    statisticsAreaLeft: {
        display: "flex",
        flexDirection: "column",
    },
    statisticsAreaAbove: {
        width: "100%",
        marginBottom: "2rem"
    },

    // Board Area styles
    boardArea: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        alignItems: "stretch",
        outline: "none",
        gap: 0
    },
    boardAreaRight: {
        height: "75vh"
    },
    mineGrid: {
        transition: "opacity 120ms"
    },
    mineGridPaused: {
        opacity: 0.5
    },
    mineGridActive: {
        opacity: 1
    },

    // Viewport styles
    viewportContent: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
        borderRadius: 8,
        background: "rgba(0,0,0,0.08)",
        border: "2px solid rgba(255,255,255,0.1)",
        width: "100%",
        flex: "1 1 auto",
        minHeight: "200px"
    },

    // Overlay button styles
    zoomControls: {
        position: "absolute",
        right: 12,
        bottom: 12,
        display: "flex",
        flexDirection: "row",
        gap: 8
    },
    helpButton: {
        position: "absolute",
        right: 12,
        top: 12,
        display: "grid"
    }


};

export default MinesweeperGameStyles;
