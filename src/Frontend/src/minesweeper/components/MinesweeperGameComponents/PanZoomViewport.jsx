/**
 * @file PanZoomViewport.jsx
 * @brief A React component that provides pan and zoom functionality for its children.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from "react";

export default forwardRef(function PanZoomViewport({
                                                       children,
                                                       minScale = 0.5,
                                                       maxScale = 3,
                                                       initialScale = 1,
                                                       autoFit = "contain"
                                                   }, ref) {
    const hostRef = useRef(null);
    const contentRef = useRef(null);

    const [scale, setScale] = useState(initialScale);
    const [tx, setTx] = useState(0);
    const [ty, setTy] = useState(0);

    const pointers = useRef(new Map());
    const isDraggingRef = useRef(false);
    const pinchBase = useRef(null);

    function clamp(val, lo, hi) { return Math.max(lo, Math.min(hi, val)); }

    const applyTransform = useCallback(() => {
        if(contentRef.current) {
            contentRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        }
    }, [scale, tx, ty]);

    useEffect(() => {
        applyTransform();
    }, [applyTransform]);

    function getMidpoint(a, b) {
        return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
    }

    function dist(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.hypot(dx, dy);
    }

    const toLocal = useCallback((clientX, clientY) => {
        const host = hostRef.current;
        if(!host) {
            return {x: 0, y: 0};
        }
        const rect = host.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        return {x: (x - tx) / scale, y: (y - ty) / scale};
    }, [scale, tx, ty]);

    const fit = useCallback((mode = "contain") => {
        const host = hostRef.current;
        const content = contentRef.current;
        if(!host || !content) {
            return;
        }

        requestAnimationFrame(() => {
            const hw = host.clientWidth;
            const hh = host.clientHeight;
            const cw = content.scrollWidth || content.offsetWidth || content.getBoundingClientRect().width;
            const ch = content.scrollHeight || content.offsetHeight || content.getBoundingClientRect().height;

            if(!cw || !ch || !hw || !hh) {
                return;
            }

            let s;
            if(mode === "width") {
                s = hw / cw;
            }
            else if(mode === "height") {
                s = hh / ch;
            }
            else {
                s = Math.min(hw / cw, hh / ch);
            }

            s = clamp(s, minScale, maxScale);
            s = Math.min(s, 1);

            const scaledW = cw * s;
            const scaledH = ch * s;
            const nx = Math.round((hw - scaledW) / 2);
            const ny = Math.round((hh - scaledH) / 2);

            setScale(s);
            setTx(nx);
            setTy(ny);
        });
    }, [minScale, maxScale]);

    const zoomTo = useCallback((targetScale, clientX = null, clientY = null) => {
        const host = hostRef.current;
        const content = contentRef.current;
        if(!host || !content) {
            return;
        }
        const hostRect = host.getBoundingClientRect();
        const cx = (clientX !== null && clientY !== null) ? clientX : (hostRect.left + hostRect.width / 2);
        const cy = (clientX !== null && clientY !== null) ? clientY : (hostRect.top + hostRect.height / 2);

        const s = clamp(targetScale, minScale, maxScale);
        const local = toLocal(cx, cy);
        const newTxAbs = cx - local.x * s;
        const newTyAbs = cy - local.y * s;

        setScale(s);
        setTx(newTxAbs - hostRect.left);
        setTy(newTyAbs - hostRect.top);
    }, [minScale, maxScale, toLocal]);

    const zoomBy = useCallback((factor, clientX = null, clientY = null) => {
        const target = clamp(scale * factor, minScale, maxScale);
        zoomTo(target, clientX, clientY);
    }, [scale, minScale, maxScale, zoomTo]);

    useImperativeHandle(ref, () => ({
        fitToContain: () => fit("contain"),
        fitToWidth: () => fit("width"),
        fitToHeight: () => fit("height"),
        zoomTo,
        zoomIn: (clientX = null, clientY = null) => zoomBy(1.2, clientX, clientY),
        zoomOut: (clientX = null, clientY = null) => zoomBy(1 / 1.2, clientX, clientY)
    }), [fit, zoomTo, zoomBy]);

    useEffect(() => {
        if(!autoFit) {
            return;
        }
        const host = hostRef.current;
        const content = contentRef.current;
        if(!host || !content) {
            return;
        }

        const recalc = () => {
            if(autoFit === "width") {
                fit("width");
            }
            else if(autoFit === "height") {
                fit("height");
            }
            else {
                fit("contain");
            }
        };

        let raf = requestAnimationFrame(recalc);

        const ro = new ResizeObserver(() => {
            requestAnimationFrame(recalc);
        });
        ro.observe(host);
        ro.observe(content);

        window.addEventListener("resize", recalc);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener("resize", recalc);
        };
    }, [autoFit, fit]);

    const onWheel = useCallback((e) => {
        if(!e.ctrlKey) {
            return;
        }
        e.preventDefault();
        const zoomIntensity = 0.0015;
        const delta = -e.deltaY;
        const newScale = clamp(scale * (1 + delta * zoomIntensity), minScale, maxScale);

        const host = hostRef.current;
        if(!host) {
            return;
        }
        const local = toLocal(e.clientX, e.clientY);
        const hostRect = host.getBoundingClientRect();
        const newTxAbs = e.clientX - (local.x * newScale);
        const newTyAbs = e.clientY - (local.y * newScale);
        setScale(newScale);
        setTx(newTxAbs - hostRect.left);
        setTy(newTyAbs - hostRect.top);
    }, [scale, minScale, maxScale, toLocal]);

    const dragThresholdSq = 36;

    const onPointerDown = useCallback((e) => {
        const el = hostRef.current;
        if(!el) {
            return;
        }
        pointers.current.set(e.pointerId, {x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY});
        if(pointers.current.size === 2) {
            try {
                el.setPointerCapture(e.pointerId);
            }
            catch {
            }
            for(const [pid] of pointers.current) {
                if(pid !== e.pointerId) {
                    try {
                        el.setPointerCapture(pid);
                    }
                    catch {
                    }
                }
            }
            isDraggingRef.current = true;
        }
    }, []);

    const onPointerMove = useCallback((e) => {
        if(!pointers.current.has(e.pointerId)) {
            return;
        }
        const el = hostRef.current;
        const prev = pointers.current.get(e.pointerId);
        const curr = {x: e.clientX, y: e.clientY, sx: prev.sx, sy: prev.sy};
        pointers.current.set(e.pointerId, curr);

        const pts = Array.from(pointers.current.values());
        if(pts.length === 1) {
            if(!isDraggingRef.current) {
                const mdx = curr.x - (curr.sx ?? curr.x);
                const mdy = curr.y - (curr.sy ?? curr.y);
                if((mdx * mdx + mdy * mdy) >= dragThresholdSq) {
                    try {
                        el && el.setPointerCapture(e.pointerId);
                    }
                    catch {
                    }
                    isDraggingRef.current = true;
                }
                else {
                    return;
                }
            }
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            setTx(t => t + dx);
            setTy(t => t + dy);
        }
    }, []);

    const onPointerUpdate = useCallback(() => {
        const pts = Array.from(pointers.current.values());
        if(pts.length === 2 && !pinchBase.current) {
            const [a, b] = pts;
            pinchBase.current = {
                mid: getMidpoint(a, b),
                dist: dist(a, b),
                scale,
                tx,
                ty
            };
        }
        else if(pts.length !== 2) {
            pinchBase.current = null;
        }
    }, [scale, tx, ty]);

    const onPointerMoveWithPinch = useCallback((e) => {
        if(!pointers.current.has(e.pointerId)) {
            return;
        }
        const curr = {x: e.clientX, y: e.clientY};
        pointers.current.set(e.pointerId, curr);

        const pts = Array.from(pointers.current.values());
        if(pts.length !== 2) {
            return;
        }
        if(!pinchBase.current) {
            return;
        }

        const [a, b] = pts;
        const d = dist(a, b);
        const k = clamp((d / pinchBase.current.dist) * pinchBase.current.scale, minScale, maxScale);

        const baseLocal = toLocal(pinchBase.current.mid.x, pinchBase.current.mid.y);
        const newTxAbs = pinchBase.current.mid.x - baseLocal.x * k;
        const newTyAbs = pinchBase.current.mid.y - baseLocal.y * k;
        const hostRect = hostRef.current.getBoundingClientRect();
        setScale(k);
        setTx(newTxAbs - hostRect.left);
        setTy(newTyAbs - hostRect.top);
    }, [minScale, maxScale, toLocal]);

    const onPointerUp = useCallback((e) => {
        const el = hostRef.current;
        if(!el) {
            return;
        }
        try {
            el.releasePointerCapture(e.pointerId);
        }
        catch {
        }
        pointers.current.delete(e.pointerId);
        if(pointers.current.size !== 2) {
            pinchBase.current = null;
        }
        if(pointers.current.size === 0) {
            isDraggingRef.current = false;
        }
    }, []);

    const onDoubleClick = useCallback(() => {
        fit("contain");
    }, [fit]);

    useEffect(() => {
        const host = hostRef.current;
        if(!host) {
            return;
        }

        const move = (e) => {
            if(pointers.current.size === 2) {
                onPointerMoveWithPinch(e);
            }
            else {
                onPointerMove(e);
            }
            onPointerUpdate();
        };

        host.addEventListener("wheel", onWheel, {passive: false});
        host.addEventListener("pointerdown", onPointerDown);
        host.addEventListener("pointermove", move);
        host.addEventListener("pointerup", onPointerUp);
        host.addEventListener("pointercancel", onPointerUp);
        host.addEventListener("pointerleave", onPointerUp);
        host.addEventListener("dblclick", onDoubleClick);

        return () => {
            host.removeEventListener("wheel", onWheel);
            host.removeEventListener("pointerdown", onPointerDown);
            host.removeEventListener("pointermove", move);
            host.removeEventListener("pointerup", onPointerUp);
            host.removeEventListener("pointercancel", onPointerUp);
            host.removeEventListener("pointerleave", onPointerUp);
            host.removeEventListener("dblclick", onDoubleClick);
        };
    }, [onPointerDown, onPointerMove, onPointerMoveWithPinch, onPointerUp, onPointerUpdate, onWheel, onDoubleClick]);

    const hostStyle = {
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "none",
        position: "relative",
        cursor: isDraggingRef.current ? "grabbing" : "grab",
        background: "transparent"
    };

    const contentStyle = {
        transformOrigin: "0 0",
        willChange: "transform",
        pointerEvents: "auto",
        display: "inline-block",
        width: "fit-content",
        height: "fit-content"
    };

    return (
            <div ref={hostRef}
                 style={hostStyle}
            >
                <div ref={contentRef}
                     style={contentStyle}
                >
                    {children}
                </div>
            </div>
    );
});
