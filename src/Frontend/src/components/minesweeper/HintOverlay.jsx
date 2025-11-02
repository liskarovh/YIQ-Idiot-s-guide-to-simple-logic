import React from "react";

function HintOverlay({rect, cellSize, gap}) {
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
        top, left, width: w, height: h,
        border: "2px solid rgba(255,255,255,0.28)",
        borderRadius: 8,
        pointerEvents: "none",
        boxShadow: "0 0 0 2px rgba(255,255,255,0.08) inset"
    };

    return <div style={style} />;
}

export default HintOverlay;
