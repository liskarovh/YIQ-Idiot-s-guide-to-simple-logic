/**
 * @file    settingsSliderRow.jsx
 * @brief   Reusable slider row for GameSettingsPage.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-13
 */

import React from 'react';

import Slider from '../../../../components/Slider.jsx';
import NumberBox from './numberBox.jsx';

export default function SettingsSliderRow({
                                              //  - 'dock'  - slider inside sliderDock with range labels rendered below,
                                              //  - 'plain' - slider rendered directly with no dock/range.
                                              variant = 'dock',

                                              // slider value
                                              value,
                                              onChange,
                                              min,
                                              max,
                                              step,

                                              // slider width
                                              sliderWidth,

                                              // range labels
                                              showRange = false,
                                              rangeLeft = null,
                                              rangeRight = null,

                                              // NumberBox sizing
                                              numberBoxWidth,
                                              numberBoxHeight,
                                              numberBoxAriaLabel,

                                              valueText,

                                              // style objects (must come from GameSettingsPage to keep identical look)
                                              rowControlWrap,
                                              innerWrapStyle, // optional override (used for timer opacity/pointerEvents)
                                              controlWrap, // base layout for 'plain'
                                              controlWrapWide, // base layout for 'dock'
                                              sliderDock, // base style for "dock" slider area
                                              sliderRangeRow, // style for range labels row under slider (dock)
                                              nbValueText, // style for value text (tight + bold)

                                              // slider visuals
                                              trackHeight,
                                              thumbSize,
                                              narrowAtPx = 160,
                                          }) {
    const baseInner =
            innerWrapStyle ||
            (variant === 'dock' ? controlWrapWide : controlWrap) ||
            {};

    const isNarrow =
            typeof sliderWidth === 'number' && sliderWidth <= narrowAtPx;

    const outer = isNarrow
            ? { ...(rowControlWrap || {}), justifyContent: 'flex-start' }
            : rowControlWrap;

    const inner = isNarrow
            ? { ...baseInner, justifyContent: 'flex-start' }
            : baseInner;

    const innerGap = inner?.gap ?? 12;
    const nbGroup = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: innerGap,
        flexWrap: 'nowrap',
        flex: '0 0 auto',
        width: 'max-content',
    };

    const dockStyle =
            variant === 'dock'
                    ? { ...(sliderDock || {}), width: sliderWidth }
                    : null;

    return (
            <div style={outer}>
                <div style={inner}>
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
}
