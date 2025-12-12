import { useEffect, useState } from "react";

function HintOverlay({ hintRectangle, cellSize = 0, gap = 0, duration = 5000 }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!hintRectangle) return;

        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [hintRectangle, duration]);

    if (!hintRectangle || !visible) {
        return null;
    }

    const { rowStart, colStart, rowEnd, colEnd } = hintRectangle;
    const top = rowStart * (cellSize + gap);
    const left = colStart * (cellSize + gap);
    const h = (rowEnd - rowStart + 1) * cellSize + (rowEnd - rowStart) * gap;
    const w = (colEnd - colStart + 1) * cellSize + (colEnd - colStart) * gap;

    const style = {
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
        width: `${w}px`,
        height: `${h}px`,
        borderRadius: 10,
        pointerEvents: "none",
        background: "rgba(255, 215, 0, 0.3)",
        border: "2px solid rgba(255, 215, 0, 0.8)",
        boxShadow: "0 0 15px rgba(255, 215, 0, 0.5), inset 0 0 10px rgba(255, 215, 0, 0.2)",
        transition: "opacity 300ms ease-out",
        opacity: visible ? 1 : 0
    };

    return <div style={style} />;
}

export default HintOverlay;
