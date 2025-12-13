import {useEffect, useState} from "react";

/**
 *
 * @brief React hook for automatic scaling based on container or window size.
 * @details This hook calculates a scaling factor based on the size of a target container
 *          or the window size. It supports different fitting modes and allows for offsets
 *          in pixels or rem units.
 *
 * Supports fit modes:
 * - "contain" (default): scale to fit both dimensions without cropping (min of width/height scales)
 * - "cover": scale to cover the viewport (max of width/height scales)
 * - "width": scale based on width only
 * - "height": scale based on height only
 *
 * @param baseWidth Reference design width in pixels (default: 1920).
 * @param baseHeight Reference design height in pixels (default: 1080).
 * @param fit How to fit the design to the viewport (default: "contain").
 * @param maxScale Maximum allowed scale (respected except when `fit` is
 *                 "width" or "height" and scale < 1) (default: 1).
 * @param minScale Minimum allowed scale (always respected) (default: 0.5).
 * @param offset Offsets to subtract from available size. Values may be numbers (treated as the given unit)
 *               or strings like "10px" or "1.5rem" (default: {width: 0, height: 0, unit: "px"}).
 * @param targetRef Element to observe for sizing; if null, the window is used (default: null).
 * @param selfRef Optional element inside the observed container. Used to avoid observing a container that
 *                itself contains the element being scaled (default: null).
 */
export default function useAutoScale(baseWidth = 1920,
                                     baseHeight = 1080,
                                     {
                                         fit = "contain",
                                         maxScale = 1,
                                         minScale = 0.5,
                                         offset = {width: 0, height: 0, unit: "px"},
                                         targetRef = null,
                                         selfRef = null
                                     } = {}) {
    // State to hold the current scale factor
    const [scale, setScale] = useState(1);

    useEffect(() => {
        // Helper to get root font size in pixels for rem calculations
        function getRootFontSizePx() {
            if(typeof window === "undefined" || !window.getComputedStyle) {
                return 16;
            }
            try {
                const fontSize = getComputedStyle(document.documentElement).fontSize;
                return parseFloat(fontSize) || 16;
            }
            catch {
                return 16;
            }
        }

        // Helper to parse offset values
        function parseOffsetValue(value, unit = "px") {
            // Null or undefined means 0 offset
            if(value == null) {
                return 0;
            }

            // If it's a number, treat it as the given unit
            if(typeof value === "number") {
                return unit === "rem" ? value * getRootFontSizePx() : value;
            }

            // If it's a string, parse it
            if(typeof value === "string") {
                const trimmed = value.trim().toLowerCase();

                // Check for px or rem suffix
                if(trimmed.endsWith("px")) {
                    return parseFloat(trimmed) || 0;
                }

                // Check for rem suffix
                if(trimmed.endsWith("rem")) {
                    return (parseFloat(trimmed) || 0) * getRootFontSizePx();
                }

                // Otherwise, try to parse as a number
                const num = parseFloat(trimmed);
                if(isNaN(num)) {
                    return 0;
                }

                return unit === "rem" ? num * getRootFontSizePx() : num;
            }

            return 0;
        }

        // Resize observer and event listeners
        let resizeObserver = null;
        let observedElement = null;

        // Resolve the candidate element to observe
        function resolveObservedElelementCandidate() {
            if(targetRef && targetRef.current) {
                return targetRef.current;
            }
            return null;
        }

        // Choose the actual observed element, avoiding selfRef containment
        function chooseObservedElement(candidateElement) {
            try {
                if(candidateElement && selfRef && selfRef.current && candidateElement.contains(selfRef.current)) {
                    // Extract parent element if candidate contains selfRef
                    const parentElement = candidateElement.parentElement instanceof Element ? candidateElement.parentElement
                                                                                            : null;

                    // Return parent only if it doesn't contain selfRef
                    if(parentElement && !(selfRef && selfRef.current && parentElement.contains(selfRef.current))) {
                        return parentElement;
                    }
                    return null;
                }
            }
            catch {
                return null;
            }

            return candidateElement;
        }

        // Get current sizes considering offsets
        function getSizes() {
            // Resolve observed element
            const candidateElement = resolveObservedElelementCandidate();
            observedElement = chooseObservedElement(candidateElement);

            const unit = (typeof offset.unit === "string") ? offset.unit
                                                           : "px";

            const offsetWidth = parseOffsetValue(offset.width, unit);
            const offsetHeight = parseOffsetValue(offset.height, unit);

            // If fit is 'width' or 'height', treat offset as margin on one side
            // and subtract both sides (2×). For other fits, keep original behavior.
            const horizontalOffset = (fit === "width") ? offsetWidth * 2 : offsetWidth;
            const verticalOffset = (fit === "height") ? offsetHeight * 2 : offsetHeight;

            // Get sizes from observed element or window
            if(observedElement) {
                const viewWidth = Math.max(1, observedElement.clientWidth - horizontalOffset);
                const viewHeight = Math.max(1, observedElement.clientHeight - verticalOffset);
                return {viewWidth, viewHeight};
            }

            // Fallback to window sizes
            const viewWidth = Math.max(1, window.innerWidth - horizontalOffset);
            const viewHeight = Math.max(1, window.innerHeight - verticalOffset);
            return {viewWidth, viewHeight};
        }

        // Update scale based on current sizes
        function update() {
            // Get current sizes
            const {viewWidth, viewHeight} = getSizes();

            // Calculate scaled dimensions
            const scaledWidth = viewWidth / baseWidth;
            const scaledHeight = viewHeight / baseHeight;

            // Determine scale based on fit mode
            let scale;
            if(fit === "cover") {
                scale = Math.max(scaledWidth, scaledHeight);
            }
            else if(fit === "width") {
                scale = scaledWidth;
            }
            else if(fit === "height") {
                scale = scaledHeight;
            }
            else {
                scale = Math.min(scaledWidth, scaledHeight);  // "contain"
            }

            // We respect minScale always, maxScale only for "contain" and "cover" or when scaling up
            if(fit === "width" || fit === "height") {
                // minScale is always lower bound
                scale = Math.max(minScale, scale);

                // maxScale is upper bound only when scaling up (scale >= 1)
                if(scale >= 1) {
                    scale = Math.min(maxScale, scale);
                }
            }
            else {
                scale = Math.min(maxScale, Math.max(minScale, scale));
            }

            // Infinite or NaN check (to prevent infinite scaling)
            if(!isFinite(scale) || isNaN(scale)) {
                return;
            }

            // Update state only if significant change
            setScale(previousScale => {
                if(!isFinite(previousScale) || isNaN(previousScale)) {
                    return scale;
                }
                if(Math.abs(previousScale - scale) < 0.0005) {
                    return previousScale;
                }
                return scale;
            });
        }

        // Initial update
        update();

        // Setup ResizeObserver if available
        const candidate = resolveObservedElelementCandidate();
        observedElement = chooseObservedElement(candidate);

        // Observe size changes on the observed element
        if(observedElement && typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(update);
            try {
                resizeObserver.observe(observedElement);
            }
            catch {
                // ignore
            }
        }

        // We also listen to window resize and orientation change events
        window.addEventListener("resize", update);
        window.addEventListener("orientationchange", update);
        window.addEventListener("fullscreenchange", update);
        window.addEventListener("webkitfullscreenchange", update);
        window.addEventListener("mozfullscreenchange", update);
        window.addEventListener("MSFullscreenChange", update);

        return () => {
            // Cleanup observers and event listeners
            if(resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener("resize", update);
            window.removeEventListener("orientationchange", update);
            window.removeEventListener("fullscreenchange", update);
            window.removeEventListener("webkitfullscreenchange", update);
            window.removeEventListener("mozfullscreenchange", update);
            window.removeEventListener("MSFullscreenChange", update);
        };
    }, [baseWidth, baseHeight, minScale, maxScale, fit, offset.width, offset.height, offset.unit, targetRef, selfRef]);

    return scale;
}
