// Frontend/src/react/tic_tac_toe/shared/dto.js

/**
 * @typedef {"running"|"won"|"draw"} Status
 * @typedef {"easy"|"medium"|"hard"} Difficulty
 * @typedef {"pvp"|"pve"} Mode
 * @typedef {"X"|"O"|"Random"} StartMark
 */

/**
 * @typedef {("."|"X"|"O")[][]} Board
 */

/**
 * @typedef {Object} GameDTO
 * @property {string} id
 * @property {Board} board
 * @property {"X"|"O"} player
 * @property {Status} status
 * @property {("X"|"O"|null)} [winner]
 * @property {number} size
 * @property {number} kToWin
 */
