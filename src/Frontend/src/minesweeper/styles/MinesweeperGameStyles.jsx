const boxWidth = 350;
const boxHeight = 630;

const MinesweeperGameStyles = {

    // Box sizes
    boxWidth: boxWidth,
    boxHeight: boxHeight,

    // Autoscale preset
    boxAutoscaleWidth: boxWidth,
    boxAutoscaleHeight: boxHeight,
    boxAutoscaleMaxScale: 1,
    boxAutoscaleMinScale: 0.8,
    boxAutoscaleCenter: true,

    // Page background and header spacing
    contentStyle: {
        padding: "7rem 2rem 0.5rem 2rem",
        minHeight: "100vh",
        boxSizing: "border-box"
    },

    // Outer shell that keeps content centered and adds a left offset from viewport
    boxLayoutStyle: {
        display: "grid",
        gridTemplateColumns: "clamp(280px, 22vw, 350px) minmax(0, 1fr)",
        columnGap: "clamp(3rem, 6vw, 6rem)",
        padding: "0rem 1rem 0rem 2rem",
        alignItems: "start",
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
        overflow: "visible"
    },

    // Action panel wrapper (kept for reference). In normal mode we render actions inside boardArea.
    actionUnderboard: {
        position: "relative"
    },

    // Floating overlays
    floatingBtn: {
        position: "absolute",
        width: 44,
        height: 44,
        borderRadius: 22,
        background: "rgba(20,20,20,0.7)",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none"
    },
    statsTogglePos: {left: 12, bottom: 12},
    actionsTogglePos: {right: 12, top: 12},

    overlayPanel: {
        position: "absolute",
        background: "rgba(30,30,30,0.92)",
        color: "#fff",
        borderRadius: 12,
        padding: 12,
        maxWidth: 320,
        maxHeight: "75vh",
        overflow: "visible",
        boxShadow: "0 8px 20px rgba(0,0,0,0.35)"
    },

    errorWrap: {
        marginTop: 16
    },




    // Statistics Area styles
    statisticsAreaLeft: {
        display: "flex",
        flexDirection: "column",
        maxWidth: boxWidth,
        maxHeight: boxHeight
    },
    statisticsAreaAbove: {
        width: "100%",
        marginBottom: "2rem",
    },

    // Board Area styles
    boardArea: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 0
    },
    boardAreaRight: {
        height: "75vh",
    },
    mineGrid: {
        transition: "opacity 120ms"
    },
    mineGridPaused: {
        opacity: 0.5,
    },
    mineGridActive: {
        opacity: 1,
    },

    // Viewport styles
    viewportContent: {
        position: "relative",
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
        flexDirection: "column",
        gap: 8
    },
    statisticsToggleButton: {
        position: "absolute",
        right: 12,
        top: 12,
        display: "grid"
    }


};

export default MinesweeperGameStyles;
