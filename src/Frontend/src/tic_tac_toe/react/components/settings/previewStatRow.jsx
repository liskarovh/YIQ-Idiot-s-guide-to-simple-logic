/**
 * @file    previewStatRow.jsx
 * @brief   Small helper for Preview card: label + value row.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-13
 */

import React from 'react';
import SettingRow from '../../../../components/SettingsRow.jsx';

/**
 * PreviewStatRow
 *
 * @param {object} props
 * @param {string|React.ReactNode} props.label   - Text (or node) to show on the left.
 * @param {React.ReactNode}        props.value   - Already styled value node on the right.
 *
 * @param {object} props.rowLabelWrapPreview     - Style object for the label wrapper
 * @param {object} props.labelSmallPreview       - Style for the label text (color, weight, size).
 * @param {object} props.rowControlWrapPreview   - Style for the value wrapper.
 */
export default function PreviewStatRow({
                                           label,
                                           value,
                                           rowLabelWrapPreview,
                                           labelSmallPreview,
                                           rowControlWrapPreview,
                                       }) {
    return (
            <SettingRow
                    label={
                        <div style={rowLabelWrapPreview}>
                            <span style={labelSmallPreview}>{label}</span>
                        </div>
                    }
                    control={<div style={rowControlWrapPreview}>{value}</div>}
            />
    );
}
