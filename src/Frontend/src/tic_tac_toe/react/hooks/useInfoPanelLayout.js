/**
 * @file    useInfoPanelLayout.js
 * @brief   Shared layout hooks for scaling Tic-Tac-Toe info panels.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import { useLayoutEffect, useMemo, useState } from 'react';

/**
 * Shared scaling hook for all info panels.
 * - contentRef: ref to the inner content wrapper
 * - maxHeightPx: max outer height in pixels
 * - deps: array of values that affect the natural height
 */
export function useInfoPanelScale(contentRef, maxHeightPx, deps = []) {
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        if (!maxHeightPx) {
            setScale(1);
            return;
        }

        const el = contentRef.current;
        if (!el) return;

        const prev = el.style.transform;
        el.style.transform = 'none';

        const natural = el.scrollHeight || 1;
        const target = Math.max(0, maxHeightPx - 2);

        el.style.transform = prev;

        const s = Math.min(1, target / natural);
        setScale(s > 0.98 ? 1 : s);
    }, [maxHeightPx, ...deps]);

    return scale;
}

/**
 * Shared badge size hook for all info panels.
 * - Uses the same clamp logic as GameInfoPanel.
 * - Reacts to maxHeightPx
 */
export function useInfoPanelBadgeSize(maxHeightPx) {
    return useMemo(() => {
        const lower = 40;
        const upper = 96;

        if (Number.isFinite(maxHeightPx) && maxHeightPx > 0) {
            const capByPanel = Math.max(lower, Math.floor(maxHeightPx * 0.28));
            return `clamp(${lower}px, min(10vmin, ${capByPanel}px), ${upper}px)`;
        }

        return `clamp(${lower}px, 10vmin, ${upper}px)`;
    }, [maxHeightPx]);
}
