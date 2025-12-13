/**
 * @file    pillRadioRow.jsx
 * @brief   SettingRow wrapper for a pill-based radio group.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-13
 */

import React from 'react';

import SettingRow from '../../../../components/SettingsRow.jsx';
import Pill from '../pill.jsx';

/**
 * PillRadioRow
 *
 * @param {object}   props
 * @param {string}   props.label          - Text label shown on the left of SettingRow.
 * @param {string}   props.value          - Currently selected option key.
 * @param {Function} props.onChange       - Callback invoked with option.key when user clicks a pill.
 * @param {Array}    props.options        - Array of { key, label, disabled? } describing available pills.
 * @param {boolean}  [props.activeGuard]  - When false, no pill is shown as active (used when the field is "disabled").
 *
 * @param {object}   props.rowLabelWrap   - Inline style for the label wrapper div (vertical alignment, minHeight).
 * @param {object}   props.labelStyle     - Inline style for the label text span (font size, weight, color).
 * @param {object}   props.rowControlWrap - Inline style for the SettingRow control wrapper (flex alignment).
 * @param {object}   props.radioGroup     - Inline style for the pill container (flex wrap, gap).
 * @param {object}   props.pillBaseStyle  - Base pill style (padding, radius, font, min height).
 */
export default function PillRadioRow({
                                         label,
                                         value,
                                         onChange,
                                         options, // [{ key, label, disabled? }]
                                         activeGuard = true,

                                         // styles (from GameSettingsPage)
                                         rowLabelWrap,
                                         labelStyle,
                                         rowControlWrap,
                                         radioGroup,
                                         pillBaseStyle,
                                     }) {
    return (
            <SettingRow
                    // Left side: label wrapper + styled text
                    label={
                        <div style={rowLabelWrap}>
                            <span style={labelStyle}>{label}</span>
                        </div>
                    }
                    // Right side: pill group
                    control={
                        <div style={rowControlWrap}>
                            <div style={radioGroup}>
                                {options.map((opt) => {
                                    const disabled = !!opt.disabled;
                                    const active = !!activeGuard && value === opt.key;

                                    return (
                                            <Pill
                                                    key={opt.key}
                                                    active={active}
                                                    onClick={() => {
                                                        if (!disabled) onChange(opt.key);
                                                    }}
                                                    style={{
                                                        ...pillBaseStyle,
                                                        opacity: disabled ? 0.45 : 1,
                                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                                    }}
                                            >
                                                {opt.label}
                                            </Pill>
                                    );
                                })}
                            </div>
                        </div>
                    }
            />
    );
}
