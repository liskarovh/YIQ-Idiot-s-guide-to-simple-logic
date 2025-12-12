/**
 * @file    constants.js
 * @brief   Shared Tic-Tac-Toe constants for difficulty, mode, and starting mark.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

/**
 * Difficulty levels for the AI.
 */
export const Difficulty = Object.freeze({
                                            EASY: 'easy',
                                            MEDIUM: 'medium',
                                            HARD: 'hard',
                                        });

/**
 * Supported game modes.
 */
export const Mode = Object.freeze({
                                      PVP: 'pvp',
                                      PVE: 'pve',
                                  });

/**
 * Starting mark configuration for the game.
 */
export const StartMark = Object.freeze({
                                           X: 'X',
                                           O: 'O',
                                           RANDOM: 'Random',
                                       });
