import React, {useRef} from "react";
import useAutoScale from "../hooks/UseAutoScale";

function AutoScale({
                       baseWidth = 1920,
                       baseHeight = 1080,
                       fit = "contain",
                       minScale = 0.5,
                       maxScale = 1,
                       center = true,
                       targetRef = null,
                       offset = undefined,
                       style = {},
                       children
                   }) {
    // Refs and scale calculation
    const outerRef = useRef(null);
    const scale = useAutoScale(baseWidth, baseHeight, {fit, minScale, maxScale, targetRef, offset, selfRef: outerRef});

    // Styles
    const outerStyle = {
        width: Math.ceil(baseWidth * scale) + 1,
        height: Math.ceil(baseHeight * scale) + 1,
        ...(center ? {display: "grid", placeItems: "center"} : {}),
        overflow: "hidden",
        boxSizing: "border-box",
        ...style
    };

    const innerStyle = {
        width: baseWidth,
        height: baseHeight,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        willChange: "transform"
    };

    return (
            <div style={outerStyle}
                 ref={outerRef}
            >
                <div style={innerStyle}>{children}</div>
            </div>
    );
}

export default AutoScale;
