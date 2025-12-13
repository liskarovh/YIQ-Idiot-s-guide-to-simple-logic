/**
 * @file    numberBox.jsx
 * @brief   Minimal number input with white border and white arrows (single background, no separators).
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

// src/components/numberBox.jsx
import React, { useEffect, useRef, useState } from 'react';
import colors from '../../../../Colors';

/**
 * NumberBox - controlled numeric input with up/down arrows.
 *
 * Props:
 * - value: number
 * - min?: number
 * - max?: number
 * - step?: number (default 1)
 * - onChange: (v:number) => void
 * - suffix?: string (e.g. "s")
 * - width?: number | string (default: clamp(...))   // responsive
 * - height?: number | string (default: clamp(...))  // responsive
 * - disabled?: boolean
 * - ariaLabel?: string
 */
export default function NumberBox({
                                      value,
                                      min,
                                      max,
                                      step = 1,
                                      onChange,
                                      suffix = '',
                                      width = 'clamp(65px, 6.5vw, 80px)',
                                      height = 'clamp(30px, 4.5vmin, 45px)',
                                      disabled = false,
                                      ariaLabel = 'number input',
                                  }) {
    const [draft, setDraft] = useState(String(Number.isFinite(value) ? value : 0));
    const lastGoodRef = useRef(Number.isFinite(value) ? value : 0);

    useEffect(() => {
        if (Number.isFinite(value)) {
            lastGoodRef.current = value;
            setDraft(String(value));
        }
    }, [value]);

    const clamp = (n) => {
        let v = n;
        if (min != null) v = Math.max(Number(min), v);
        if (max != null) v = Math.min(Number(max), v);
        return v;
    };

    const snapToStep = (n) => {
        const base = min != null ? Number(min) : 0;
        const s = Number(step) || 1;
        const k = Math.round((n - base) / s);
        return base + k * s;
    };

    const canInc = !disabled && (max == null || Number(value) < Number(max));
    const canDec = !disabled && (min == null || Number(value) > Number(min));

    const commit = (raw) => {
        const t = String(raw ?? '').trim();
        if (t === '') return;

        const num = Number(t);
        if (!Number.isFinite(num)) return;

        onChange?.(clamp(snapToStep(num)));
    };

    const inc = () => {
        if (!canInc) return;
        onChange?.(clamp(snapToStep(Number(value) + Number(step))));
    };

    const dec = () => {
        if (!canDec) return;
        onChange?.(clamp(snapToStep(Number(value) - Number(step))));
    };

    const onBlur = () => {
        if (draft.trim() === '') {
            setDraft(String(lastGoodRef.current));
            return;
        }
        commit(draft);
        setDraft(String(clamp(snapToStep(Number(draft)))));
    };

    const onKeyDown = (e) => {
        if (disabled) return;

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            inc();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            dec();
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
            e.currentTarget.blur();
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(String(lastGoodRef.current));
            e.currentTarget.blur();
        }
    };

    const border = 'rgba(255,255,255,0.78)';

    // Single background for the whole component (no split/sections).
    const bg = disabled
            ? `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%),
       linear-gradient(to bottom, ${colors.secondary} 0%, ${colors.primary} 100%)`
            : `linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%),
       linear-gradient(to bottom, ${colors.secondary} 0%, ${colors.primary} 100%)`;

    const wrap = {
        display: 'inline-flex',
        alignItems: 'center',
        width,
        height,
        borderRadius: 10,
        border: `1px solid ${border}`,
        background: bg,
        overflow: 'hidden',
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        paddingInline: 'clamp(4px, 0.8vw, 6px)',
        gap: 'clamp(4px, 0.8vw, 6px)',
        boxSizing: 'border-box',
    };

    const inputWrap = {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    };

    // Slightly bigger number
    const input = {
        width: '100%',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        color: colors.text_header,
        fontWeight: 800,
        fontSize: 'clamp(15px, 2.2vw, 17px)',
        textAlign: 'center',
        padding: 0,
        lineHeight: 1,
    };

    const suffixStyle = {
        color: colors.text_header,
        fontWeight: 800,
        fontSize: 'clamp(10px, 1.6vw, 11px)',
        opacity: 0.9,
        userSelect: 'none',
        flex: '0 0 auto',
        lineHeight: 1,
    };

    const arrows = {
        width: 'clamp(16px, 2.4vw, 18px)',
        height: '100%',
        display: 'grid',
        gridTemplateRows: '1fr 1fr',
        alignItems: 'center',
        justifyItems: 'center',
    };

    const arrowBtn = (enabled) => ({
        width: 'clamp(14px, 2.0vw, 16px)',
        height: 'clamp(10px, 1.6vw, 12px)',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        color: colors.text_header,
        cursor: enabled ? 'pointer' : 'not-allowed',
        opacity: enabled ? 0.95 : 0.28,
        fontSize: 'clamp(9px, 1.4vw, 10px)',
        fontWeight: 900,
        lineHeight: 1,
        userSelect: 'none',
        padding: 0,
    });

    return (
            <div
                    style={wrap}
                    role="spinbutton"
                    aria-label={ariaLabel}
                    aria-valuenow={Number(value)}
                    aria-valuemin={min != null ? Number(min) : undefined}
                    aria-valuemax={max != null ? Number(max) : undefined}
            >
                <div style={inputWrap}>
                    <input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={onBlur}
                            onKeyDown={onKeyDown}
                            inputMode="numeric"
                            style={input}
                            aria-label={ariaLabel}
                    />
                    {suffix ? <span style={suffixStyle}>{suffix}</span> : null}
                </div>

                <div style={arrows} aria-hidden="true">
                    <button type="button" style={arrowBtn(canInc)} onClick={inc} disabled={!canInc} title="Increase">
                        ▲
                    </button>
                    <button type="button" style={arrowBtn(canDec)} onClick={dec} disabled={!canDec} title="Decrease">
                        ▼
                    </button>
                </div>
            </div>
    );
}
