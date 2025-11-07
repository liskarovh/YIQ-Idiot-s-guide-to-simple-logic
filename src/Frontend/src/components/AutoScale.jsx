import React from "react";
import useAutoScale from "../hooks/UseAutoScale";

/**
 * Wrapper, který „zvětšuje/zmenšuje“ vnitřek pomocí CSS transform.
 * Vnější box má fyzickou velikost = (base * scale), takže layout kolem funguje správně.
 */
export default function AutoScale({
                                      baseWidth = 1920,
                                      baseHeight = 1080,
                                      fit = "contain",
                                      minScale = 0.5,
                                      maxScale = 1,
                                      center = true,
                                      style = {},
                                      children
                                  }) {
    const scale = useAutoScale(baseWidth, baseHeight, {fit, minScale, maxScale});

    const outer = {
        width: Math.round(baseWidth * scale),
        height: Math.round(baseHeight * scale),
        ...(center ? {display: "grid", placeItems: "center"} : {}),
        overflow: "hidden",
        ...style
    };

    const inner = {
        width: baseWidth,
        height: baseHeight,
        transform: `scale(${scale})`,
        transformOrigin: "top left"
    };

    return (
            <div style={outer}>
                <div style={inner}>{children}</div>
            </div>
    );
}
