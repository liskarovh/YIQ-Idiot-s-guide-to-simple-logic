import React from "react";

function HintOverlay({rect, cellSize = 0, gap = 0}) {
    if(!rect) {
        return null;
    }
    const {r0, c0, r1, c1} = rect;

    const top = r0 * (cellSize + gap);
    const left = c0 * (cellSize + gap);
    const h = (r1 - r0 + 1) * cellSize + (r1 - r0) * gap;
    const w = (c1 - c0 + 1) * cellSize + (c1 - c0) * gap;

    const style = {
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
        width: `${w}px`,
        height: `${h}px`,
        borderRadius: 10,
        pointerEvents: "none",

        /* ovcerlay */
        background: "linear-gradient(180deg, rgba(255,245,180,0.18), rgba(255,200,60,0.22))",
        border: "3px solid rgba(255,200,30,0.95)",
        boxShadow:
                "0 12px 30px rgba(255,170,0,0.34), 0 0 18px rgba(255,200,50,0.12), inset 0 0 6px rgba(255,240,180,0.06)",
        backdropFilter: "blur(4px) saturate(1.25)",
        WebkitBackdropFilter: "blur(4px) saturate(1.25)",

        /* animation */
        transition: "box-shadow 160ms ease, transform 160ms ease, opacity 160ms ease",
        opacity: 0.98,
        transform: "translateZ(0)"
    };

    return <div
            style={style}
    />;
}

export default HintOverlay;
