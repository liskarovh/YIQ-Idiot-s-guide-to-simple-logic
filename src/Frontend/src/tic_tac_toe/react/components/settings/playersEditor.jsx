/**
 * @file    playersEditor.jsx
 * @brief   Players block (badges + inputs) for GameSettingsPage.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-13
 */

import React from 'react';

import SettingRow from '../../../../components/SettingsRow.jsx';
import PlayerBadge from '../playerBadge.jsx';

/**
 * PlayersEditor
 *
 * @param {object}   props
 * @param {string}   props.xName                 - Current value for player X name input.
 * @param {string}   props.oName                 - Current value for player O name input.
 * @param {Function} props.setXName              - Setter for X name (called with new string).
 * @param {Function} props.setOName              - Setter for O name (called with new string).
 * @param {string}   props.xLabel                - Label shown inside X PlayerBadge.
 * @param {string}   props.oLabel                - Label shown inside O PlayerBadge.
 * @param {string}   props.mode                  - Current mode ("pve" | "pvp") to choose O placeholder.
 *
 * @param {object}   props.rowControlCenterWrap  - Style for outer control wrapper (center alignment).
 * @param {object}   props.playersBadgesPad      - Style for padding block around badges row.
 * @param {object}   props.playersGrid           - Style for the 2-column badge grid.
 * @param {object}   props.badgeIconOnlyWrap     - Style that clips badge text and keeps only icon circle visible.
 * @param {string}   props.nameBadgeSize         - Size used for PlayerBadge components (width/height).
 * @param {object}   props.playersInputsGrid     - Style for the 2-column inputs grid.
 * @param {object}   props.inputText             - Style for text inputs (background, border, font).
 */
export default function PlayersEditor({
                                          xName,
                                          oName,
                                          setXName,
                                          setOName,
                                          xLabel,
                                          oLabel,
                                          mode,
                                          rowControlCenterWrap,
                                          playersBadgesPad,
                                          playersGrid,
                                          badgeIconOnlyWrap,
                                          nameBadgeSize,
                                          playersInputsGrid,
                                          inputText,
                                      }) {
    return (
            <>
                {/* Row 1: visual badges (X / O) only, no labels on the left */}
                <SettingRow
                        label={null}
                        control={
                            <div style={rowControlCenterWrap}>
                                <div style={playersBadgesPad}>
                                    <div style={playersGrid}>
                                        <div style={badgeIconOnlyWrap}>
                                            <PlayerBadge kind="X" label={xLabel} size={nameBadgeSize} />
                                        </div>
                                        <div style={badgeIconOnlyWrap}>
                                            <PlayerBadge kind="O" label={oLabel} size={nameBadgeSize} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                />

                {/* Row 2: name inputs for both players */}
                <SettingRow
                        label={null}
                        control={
                            <div style={rowControlCenterWrap}>
                                <div style={playersInputsGrid}>
                                    <input
                                            style={inputText}
                                            value={xName}
                                            onChange={(e) => setXName(e.target.value)}
                                            aria-label="Player X name"
                                            placeholder="Player X"
                                    />
                                    <input
                                            style={inputText}
                                            value={oName}
                                            onChange={(e) => setOName(e.target.value)}
                                            aria-label="Player O name"
                                            placeholder={mode === 'pve' ? 'Computer' : 'Player O'}
                                    />
                                </div>
                            </div>
                        }
                />
            </>
    );
}
