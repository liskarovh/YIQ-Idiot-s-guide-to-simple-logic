/**
 * @file    settingsSliderRow.jsx
 * @brief   Reusable slider row for GameSettingsPage (dock + range OR plain).
 *
 * Fixes narrow-layout issues:
 * - prevents right-aligned "floating" slider group on small widths
 * - keeps NumberBox + value text together (no split wrapping)
 * - forces SettingRow label to null (avoids empty label placeholder nodes)
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-13
 */

import React from 'react';

import SettingRow from '../../../../components/SettingsRow.jsx';
import Slider from '../../../../components/Slider.jsx';
import NumberBox from './numberBox.jsx';

export default function SettingsSliderRow({
                                              variant = 'dock', // 'dock' = sliderDock + range labels, 'plain' = direct slider

                                              // values
                                              value,
                                              onChange,
                                              min,
                                              max,
                                              step,

                                              // sizing
                                              sliderWidth,

                                              // range labels (dock variant)
                                              showRange = false,
                                              rangeLeft = null,
                                              rangeRight = null,

                                              // NumberBox
                                              numberBoxWidth,
                                              numberBoxHeight,
                                              numberBoxAriaLabel,

                                              // value next to NumberBox
                                              valueText,

                                              // style objects (must come from GameSettingsPage to keep identical look)
                                              rowControlWrap,
                                              innerWrapStyle, // optional override (used for timer opacity/pointerEvents)
                                              controlWrap, // used by 'plain'
                                              controlWrapWide, // used by 'dock'
                                              sliderDock, // used by 'dock'
                                              sliderRangeRow, // used by 'dock'
                                              nbValueText, // style for value text

                                              // slider visuals
                                              trackHeight,
                                              thumbSize,

                                              // narrow behavior tuning (keeps look identical on normal widths)
                                              narrowAtPx = 150,
                                          }) {
    const baseInner =
            innerWrapStyle || (variant === 'dock' ? controlWrapWide : controlWrap) || {};

    const isNarrow =
            typeof sliderWidth === 'number' ? sliderWidth <= narrowAtPx : false;

    // ✅ On narrow widths: do NOT push the whole group to the right
    // (this is what creates the "left gap" in your screenshot)
    const patchedRowControlWrap = isNarrow
            ? { ...(rowControlWrap || {}), justifyContent: 'flex-start' }
            : rowControlWrap;

    const patchedInner = isNarrow
            ? { ...baseInner, justifyContent: 'flex-start' }
            : baseInner;

    // Keep NB + value text together (prevents "value" dropping alone)
    const innerGap = patchedInner?.gap ?? (variant === 'dock' ? 12 : 12);
    const nbGroup = {
        display: 'flex',
        alignItems: 'center',
        gap: innerGap,
        flexWrap: 'nowrap',
    };

    const dockStyle =
            variant === 'dock'
                    ? { ...(sliderDock || {}), width: sliderWidth }
                    : null;

    const controlNode = (
            <div style={patchedRowControlWrap}>
                <div style={patchedInner}>
                    {variant === 'dock' ? (
                            <div style={dockStyle}>
                                <Slider
                                        min={min}
                                        max={max}
                                        step={step}
                                        value={value}
                                        onChange={onChange}
                                        width={sliderWidth}
                                        trackHeight={trackHeight}
                                        thumbSize={thumbSize}
                                />
                                {showRange ? (
                                        <div style={sliderRangeRow}>
                                            <span>{rangeLeft ?? min}</span>
                                            <span>{rangeRight ?? max}</span>
                                        </div>
                                ) : null}
                            </div>
                    ) : (
                            <Slider
                                    min={min}
                                    max={max}
                                    step={step}
                                    value={value}
                                    onChange={onChange}
                                    width={sliderWidth}
                                    trackHeight={trackHeight}
                                    thumbSize={thumbSize}
                            />
                    )}

                    <div style={nbGroup}>
                        <NumberBox
                                value={value}
                                min={min}
                                max={max}
                                step={step}
                                onChange={onChange}
                                width={numberBoxWidth}
                                height={numberBoxHeight}
                                ariaLabel={numberBoxAriaLabel}
                        />
                        <div style={nbValueText}>{valueText}</div>
                    </div>
                </div>
            </div>
    );
    return <SettingRow label={null} control={controlNode} />;
}
