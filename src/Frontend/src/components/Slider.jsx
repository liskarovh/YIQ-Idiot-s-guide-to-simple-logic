/**
 * @file Slider.jsx
 * @brief Custom Slider component controllable by mouse and touch.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React, { useMemo, useRef, useState } from 'react';
import colors from '../Colors';

/**
 * Slider (custom) - Custom Slider component controllable by mouse and touch.
 *
 * Props:
 * - value: number - current value
 * - min: number - minimum permitted value
 * - max: number - maximum permitted value
 * - step?: number - increment step (default 1)
 * - onChange: (v: number) => void - callback invoked when value changes
 * - labelRight?: string | ReactNode - optional right-side label (e.g. "16 rows")
 */
function Slider({
                    value,
                    min,
                    max,
                    step = 1,
                    onChange,
                    labelRight,
                    width = 420,
                    trackHeight = 15,
                    thumbSize = 35
                }) {
    const clamped = (v) => Math.min(max, Math.max(min, v));
    const roundToStep = (v) => Math.round((v - min) / step) * step + min;

    const pct = useMemo(() => ((clamped(value) - min) / (max - min)) * 100, [value, min, max]);
    const trackRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    function setFromPointer(clientX) {
        const rect = trackRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        const raw = min + (x / rect.width) * (max - min);
        const next = clamped(roundToStep(raw));
        if (next !== value) onChange?.(next);
    }

    function handlePointerDown(e) {
        e.preventDefault();
        trackRef.current.setPointerCapture?.(e.pointerId);
        setDragging(true);
        setFromPointer(e.clientX);
    }

    function handlePointerMove(e) {
        if (!dragging) return;
        setFromPointer(e.clientX);
    }

    function handlePointerUp(e) {
        setDragging(false);
        trackRef.current.releasePointerCapture?.(e.pointerId);
    }

    // Slider + gap
    const container = {
        display: 'flex',
        alignItems: 'center',
        width: width + 20
    };

    // Selected part of the slider
    const track = {
        position: 'relative',
        width: width,
        height: trackHeight,
        borderRadius: trackHeight / 2,
        background: `linear-gradient(90deg, ${colors.text_header} ${pct}%, ${colors.text_faded} ${pct}%)`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)',
        cursor: 'pointer',
    };

    // Slider handle
    const thumb = {
        position: 'absolute',
        top: (trackHeight - thumbSize) / 2,
        left: `calc(${pct}% - ${thumbSize / 2}px)`,
        width: thumbSize,
        height: thumbSize,
        borderRadius: thumbSize / 2,
        background: colors.text_header,
        boxShadow: '0 2px 6px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.9) inset',
        transition: dragging ? 'none' : 'left 120ms ease',
    };

    const label = {
        minWidth: 90,
        textAlign: 'right',
        color: colors.text_header,
        fontWeight: 700,
        fontSize: 24,
    };

    return (
            <div style={container}>
                <div
                        ref={trackRef}
                        style={track}
                        role="slider"
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={value}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                >
                    <div style={thumb} />
                </div>
                {labelRight != null && <div style={label}>{labelRight}</div>}
            </div>
    );
}

export default Slider;
