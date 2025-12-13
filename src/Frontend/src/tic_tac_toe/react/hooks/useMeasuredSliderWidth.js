/**
 * @file    useMeasuredSliderWidth.js
 * @brief   Measure available width for sliders inside a referenced container.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-13
 */

import { useLayoutEffect, useState } from 'react';

/**
 * Hook that measures the horizontal space inside a container and returns
 * a clamped width value for a slider (or any child control).
 *
 * @param {React.RefObject<HTMLElement>} ref
 *        Ref to the container whose width should be measured.
 * @param {number} reservePx
 *        Fixed number of pixels to subtract from the measured container width
 * @param {number} minPx
 *        Minimum allowed slider width.
 * @param {number} maxPx
 *        Maximum allowed slider width.
 * @param {number} fallbackPx
 *        Initial width before the first measurement completes.
 *
 * @returns {number} The current clamped slider width.
 */
export default function useMeasuredSliderWidth(
    ref,
    reservePx,
    minPx,
    maxPx,
    fallbackPx,
) {
    const [width, setWidth] = useState(fallbackPx);

    useLayoutEffect(() => {
        const el = ref?.current;
        if (!el || typeof ResizeObserver === 'undefined') return;

        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

        // Recalculate slider width based on the current container width
        const recalc = () => {
            const w = Math.round(el.getBoundingClientRect().width || 0);
            const next = clamp(w - reservePx, minPx, maxPx);
            setWidth(next);
        };

        // Initial measurement
        recalc();

        // React to container resize
        const ro = new ResizeObserver(recalc);
        ro.observe(el);

        // react to global window resize
        window.addEventListener('resize', recalc);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', recalc);
        };
    }, [ref, reservePx, minPx, maxPx]);

    return width;
}
