/**
 * @file MinesweeperSlider.jsx
 * @brief A custom slider component for Minesweeper settings.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React, {useMemo, useRef, useState} from "react";
import colors from "../../../Colors";

/**
 * @brief A custom slider component for Minesweeper settings.
 *
 * @param value Current value of the slider.
 * @param min Minimum value of the slider.
 * @param max Maximum value of the slider.
 * @param width Width of the slider track.
 * @param step Increment step for the slider.
 * @param onChange Callback function invoked when the slider value changes.
 * @param labelRight Optional label displayed to the right of the slider.
 */
function MinesweeperSlider({
                               value,
                               min,
                               max,
                               width,
                               step = 1,
                               onChange,
                               labelRight
                           }) {
    // Clamp value between min and max
    const clamped = (value) => Math.min(max, Math.max(min, value));
    const roundToStep = (value) => Math.round((value - min) / step) * step + min;

    // Calculate percentage position of the thumb
    const percentage = useMemo(() => ((clamped(value) - min) / (max - min)) * 100, [value, min, max]);
    const trackRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    // Set slider value based on pointer position
    function setFromPointer(clientX) {
        const boundingRect = trackRef.current.getBoundingClientRect();

        // Calculate raw value from pointer position
        const x = Math.min(Math.max(clientX - boundingRect.left, 0), boundingRect.width);
        const raw = min + (x / boundingRect.width) * (max - min);

        // Round and clamp the value, then invoke onChange if it has changed
        const next = clamped(roundToStep(raw));
        if(next !== value) {
            onChange?.(next);
        }
    }

    // Pointer event handlers
    function handlePointerDown(event) {
        event.preventDefault();
        trackRef.current.setPointerCapture?.(event.pointerId);
        setDragging(true);
        setFromPointer(event.clientX);
    }

    // Handle pointer movement
    function handlePointerMove(e) {
        if(!dragging) {
            return;
        }
        setFromPointer(e.clientX);
    }

    // Handle pointer release
    function handlePointerUp(e) {
        setDragging(false);
        trackRef.current.releasePointerCapture?.(e.pointerId);
    }

    const containerStyle = {
        display: "flex",
        alignItems: "center",
        gap: "clamp(10px, 1.2vw, 14px)",
        minWidth: 0,
        flexShrink: 0
    };

    const trackStyle = {
        position: "relative",
        width: width || "clamp(180px, 25vw, 295px)",
        height: "clamp(10px, 1.5vw, 15px)",
        borderRadius: "clamp(5px, 0.75vw, 7.5px)",
        background: `linear-gradient(90deg, ${colors.text_header} ${percentage}%, ${colors.text_faded} ${percentage}%)`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
        cursor: "pointer",
        flexShrink: 0
    };

    const thumbSize = "clamp(24px, 3.5vw, 35px)";
    const thumbStyle = {
        position: "absolute",
        top: `calc((clamp(10px, 1.5vw, 15px) - ${thumbSize}) / 2)`,
        left: `calc(${percentage}% - ${thumbSize} / 2)`,
        width: thumbSize,
        height: thumbSize,
        borderRadius: "50%",
        background: colors.text_header,
        boxShadow: "0 2px 6px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.9) inset",
        transition: dragging ? "none" : "left 120ms ease"
    };

    const labelStyle = {
        minWidth: "clamp(60px, 9vw, 90px)",
        textAlign: "right",
        color: colors.text_header,
        fontWeight: 700,
        fontSize: "clamp(16px, 2.4vw, 24px)",
        flexShrink: 0
    };

    return (
            <div style={containerStyle}>
                <div ref={trackRef}
                     style={trackStyle}
                     role="slider"
                     aria-valuemin={min}
                     aria-valuemax={max}
                     aria-valuenow={value}
                     onPointerDown={handlePointerDown}
                     onPointerMove={handlePointerMove}
                     onPointerUp={handlePointerUp}
                >
                    <div style={thumbStyle} />
                </div>
                {labelRight != null &&
                 <div style={labelStyle}>{labelRight}</div>}
            </div>
    );
}

export default MinesweeperSlider;
