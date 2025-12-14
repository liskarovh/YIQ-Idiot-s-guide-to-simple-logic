/**
 * @file ServerCommunicationModel.jsx
 * @brief Module for handling all communication with the Sudoku backend API, including fetching state, new grids, hints, reveals, and mistakes.
 *
 * @author David Krejčí <xkrejcd00>
 */
import React, { useState, useEffect } from 'react';
import { mapGridToSend } from './APIMappers';

/** @brief The base URL for the Sudoku API. Defaults to http://localhost:5000 if not set in environment variables. */
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * @brief Fetches the current state of the Sudoku game from the server.
 * @returns {Promise<object>} An object containing the server response data and an error code.
 */
export async function fetchState() {
    try {
        console.log("Sending GET to /state")
        const response = await fetch(`${apiUrl}/api/sudoku/state`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            console.error("Got error for GET request to /state")
            return { err: response.status, message: `HTTP error ${response.status}` };
        }

        const data = await response.json();
        console.log("Got response for GET request to /state")
        return { ...data, err: 0 };
    } catch (err) {
        return { err: -1, message: err.message || 'Network error' };
    }
}

/**
 * @brief Sends the current local Sudoku state (grid, game info) to the server for synchronization.
 * @param {object} sudokuState - The state object to send.
 * @returns {Promise<object>} An object containing the server response data and an error code.
 */
export async function sendState(sudokuState) {
    try {
        console.log("Sending POST to /state")
        const response = await fetch(`${apiUrl}/api/sudoku/state`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sudokuState),
        });

        if (!response.ok) {
            console.error("Got error for POST request to /state")
            return { err: response.status, message: `HTTP error ${response.status}` };
        }

        const data = await response.json();
        console.log("Got response for POST request to /state")
        return { ...data, err: 0 };
    } catch (err) {
        return { err: -1, message: err.message || 'Network error' };
    }
}


/**
 * @brief Requests a new Sudoku grid from the server based on the selected mode and difficulty.
 * @param {string} mode - The game mode (e.g., "Generated", "Prebuilt").
 * @param {string} difficulty - The difficulty level.
 * @returns {Promise<object>} An object containing the new grid data and error code.
 */
export async function fetchNewGrid(mode, difficulty) {
    try {
        console.log(`Sending GET to /new_grid with mode=${mode} and difficulty=${difficulty}`);
        
        // Create query parameters
        const params = new URLSearchParams({
            mode: mode,
            difficulty: difficulty
        });

        const response = await fetch(`${apiUrl}/api/sudoku/new_grid?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            console.error("Got error for GET request to /new_grid");
            return { err: response.status, message: `HTTP error ${response.status}` };
        }

        const data = await response.json();
        console.log("Got response for GET request to /new_grid");
        return { ...data, err: 0 };
    } catch (err) {
        return { err: -1, message: err.message || 'Network error' };
    }
}

/**
 * @brief Requests a hint from the server based on the current grid state.
 * @param {Array<Array<object>>} currentGrid - The current Sudoku grid data.
 * @returns {Promise<object>} An object containing hint details (title, text, highlights, etc.) and error code.
 */
export async function fetchHint(currentGrid) {
    try {
        // Send current state first to ensure server is synced
        const gridPayload = { grid: mapGridToSend(currentGrid) };
        await sendState(gridPayload);

        console.log("Sending GET to /hint");
        const response = await fetch(`${apiUrl}/api/sudoku/hint`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            console.error("Got error for GET request to /hint");
            return { err: response.status, message: `HTTP error ${response.status}` };
        }
        
        const data = await response.json();
        console.log("Got response for GET request to /hint");
        return { ...data, err: 0 };
    } catch (err) {
        return { err: -1, message: err.message || 'Network error' };
    }
}

/**
 * @brief Requests the solved value for a specific cell from the server.
 * @param {number} row - The row index of the cell.
 * @param {number} col - The column index of the cell.
 * @returns {Promise<object>} An object containing the revealed value and error code.
 */
export async function fetchReveal(row, col) {
    try {
        console.log(`Sending GET to /get_value for (${row}, ${col})`);
        const response = await fetch(`${apiUrl}/api/sudoku/get_value?row=${row}&col=${col}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            return { err: response.status, message: `HTTP error ${response.status}` };
        }

        const data = await response.json(); // Expected: { value: 5, err: 0 }
        return { ...data, err: 0 };
    } catch (err) {
        return { err: -1, message: err.message || 'Network error' };
    }
}

/**
 * @brief Requests the current mistake status (incorrectly filled cells) from the server.
 * @param {Array<Array<object>>} currentGrid - The current Sudoku grid data.
 * @returns {Promise<object>} An object containing a 9x9 boolean array of mistakes and error code.
 */
export async function fetchMistakes(currentGrid) {
    try {
        // 1. Send current state first to ensure server is synced
        const gridPayload = { grid: mapGridToSend(currentGrid) };
        await sendState(gridPayload);

        // 2. Request mistakes
        console.log("Sending GET to /mistakes");
        const response = await fetch(`${apiUrl}/api/sudoku/mistakes`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            return { err: response.status, message: `HTTP error ${response.status}` };
        }

        const data = await response.json(); // Expected: { mistakes: [[bool...]], err: 0 }
        return { ...data, err: 0 };
    } catch (err) {
        return { err: -1, message: err.message || 'Network error' };
    }
}