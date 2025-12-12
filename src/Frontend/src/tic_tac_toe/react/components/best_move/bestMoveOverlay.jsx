/**
 * @file    bestMoveOverlay.jsx
 * @brief   Overlay component visualizing best-move analysis for Tic-Tac-Toe.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

// src/Frontend/src/react/tic_tac_toe/components/bestMoveOverlay.jsx
import React, {useLayoutEffect, useState} from "react";
import {createPortal} from "react-dom";

export default function BestMoveOverlay({
                                            anchorRef,       // Anchor element
                                            open,
                                            onClose,
                                            move,
                                            explain,         // Plain string explanation fallback
                                            explainRich,     // { summary, reasons[], hints:{bestRun,distanceFromCenterChebyshev}, winningSequence[] }
                                            stats,           // { rollouts }
                                            analysis,        // { difficulty }
                                            loading,
                                            radius = 24,
                                            pad = 12
                                        }) {
    const [rect, setRect] = useState(null);

    useLayoutEffect(() => {
        if (!open) return;
        const el = anchorRef?.current;
        if (!el) return;

        const update = () => {
            const r = el.getBoundingClientRect();
            setRect({
                top: Math.round(r.top),
                left: Math.round(r.left),
                width: Math.round(r.width),
                height: Math.round(r.height)
            });
        };

        update();

        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, {passive: true});

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
        };
    }, [open, anchorRef]);

    if (!open || !rect) return null;

    const rollouts = (stats && typeof stats.rollouts === "number") ? stats.rollouts : null;
    const difficulty = analysis?.difficulty || "hard";
    const summary = explainRich?.summary || explain || (loading ? "Calculating…" : "—");
    const reasons = Array.isArray(explainRich?.reasons) ? explainRich.reasons : [];
    const hints = explainRich?.hints || {};
    const winSeq = Array.isArray(explainRich?.winningSequence) ? explainRich.winningSequence : [];

    return createPortal(
            <div
                    aria-hidden="true"
                    onClick={onClose}
                    style={{
                        position: "fixed",
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        zIndex: 2000,
                        borderRadius: radius,
                        background: "rgba(2, 6, 23, 0.55)",
                        backdropFilter: "blur(2px)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.35), -2px 4px 4px rgba(255,255,255,0.08)",
                    }}
            >
                <div
                        role="dialog"
                        aria-label="Best move"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "absolute",
                            top: pad,
                            left: pad,
                            right: pad,
                            maxHeight: `calc(100% - ${pad * 2}px)`,
                            overflow: "auto",
                            borderRadius: radius,
                            background: "#0F172A",
                            color: "#CBD5E1",
                            border: "2px solid #0F172A",
                            padding: 16,
                        }}
                >
                    {/* Header area with title, stats and close button */}
                    <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 6}}>
                        <h3 style={{margin: 0, fontWeight: 700}}>Best move</h3>
                        {typeof rollouts === "number" && (
                                <span
                                        style={{
                                            marginLeft: 8,
                                            padding: "2px 8px",
                                            borderRadius: 9999,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            background: "rgba(148,163,184,0.08)",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            color: "#cbd5e1",
                                        }}
                                >
              rollouts: {rollouts}
            </span>
                        )}
                        {difficulty && (
                                <span
                                        style={{
                                            padding: "2px 8px",
                                            borderRadius: 9999,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            background: "rgba(34,197,94,0.08)",
                                            border: "1px solid rgba(34,197,94,0.35)",
                                            color: "#86efac",
                                        }}
                                >
              difficulty: {difficulty}
            </span>
                        )}
                        <button
                                onClick={onClose}
                                aria-label="Close"
                                style={{
                                    marginLeft: "auto",
                                    background: "transparent",
                                    border: 0,
                                    color: "#CBD5E1",
                                    fontSize: 22,
                                    cursor: "pointer",
                                    lineHeight: 1,
                                }}
                        >
                            ×
                        </button>
                    </div>

                    {/* Recommended move preview */}
                    {Array.isArray(move) && (
                            <div
                                    style={{
                                        display: "inline-flex",
                                        gap: 10,
                                        alignItems: "center",
                                        background: "rgba(100,116,139,0.10)",
                                        border: "1px solid rgba(100,116,139,0.35)",
                                        color: "#e2e8f0",
                                        padding: "8px 10px",
                                        borderRadius: 10,
                                        margin: "6px 0 8px",
                                    }}
                            >
                                <strong>Best move:</strong>
                                <span style={{fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"}}>
              [{move[0]}, {move[1]}]
            </span>
                            </div>
                    )}

                    {/* Reasons for the selected move */}
                    {reasons.length > 0 && (
                            <>
                                <div
                                        style={{
                                            color: "#94a3b8",
                                            fontSize: 12,
                                            textTransform: "uppercase",
                                            letterSpacing: 0.4,
                                            marginBottom: 6,
                                        }}
                                >
                                    Why this move
                                </div>
                                <ul style={{margin: 0, paddingLeft: 18, color: "#e5e7eb"}}>
                                    {reasons.map((r, i) => (
                                            <li key={i} style={{marginBottom: 6}}>
                                                <strong>{r.type || r.name || "Reason"}:</strong> {r.detail || r.text || ""}
                                            </li>
                                    ))}
                                </ul>
                            </>
                    )}

                    {/* Short metric hints */}
                    {(hints.bestRun != null || hints.distanceFromCenterChebyshev != null) && (
                            <div style={{marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap"}}>
                                {hints.bestRun != null && (
                                        <div
                                                style={{
                                                    padding: "4px 10px",
                                                    borderRadius: 9999,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    background: "rgba(234,179,8,0.10)",
                                                    border: "1px solid rgba(234,179,8,0.35)",
                                                    color: "#fde68a",
                                                }}
                                        >
                                            line length: {hints.bestRun}
                                        </div>
                                )}
                                {hints.distanceFromCenterChebyshev != null && (
                                        <div
                                                style={{
                                                    padding: "4px 10px",
                                                    borderRadius: 9999,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    background: "rgba(148,163,184,0.08)",
                                                    border: "1px solid rgba(148,163,184,0.35)",
                                                    color: "#cbd5e1",
                                                }}
                                        >
                                            distance from center (Chebyshev): {hints.distanceFromCenterChebyshev}
                                        </div>
                                )}
                            </div>
                    )}

                    {/* Optional winning sequence */}
                    {winSeq.length > 0 && (
                            <div style={{marginTop: 14}}>
                                <div
                                        style={{
                                            color: "#94a3b8",
                                            fontSize: 12,
                                            textTransform: "uppercase",
                                            letterSpacing: 0.4,
                                            marginBottom: 6,
                                        }}
                                >
                                    Potential winning sequence
                                </div>
                                <code style={{display: "block", whiteSpace: "pre-wrap", color: "#cbd5e1"}}>
                                    {JSON.stringify(winSeq)}
                                </code>
                            </div>
                    )}
                </div>
            </div>,
            document.body
    );
}
