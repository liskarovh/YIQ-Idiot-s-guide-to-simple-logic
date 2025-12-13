import React, { useState, useEffect } from 'react';
import { mapGridToSend } from './APIMappers';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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


export async function fetchNewGrid() {
    try {
        console.log("Sending GET to /new_grid")
        const response = await fetch(`${apiUrl}/api/sudoku/new_grid`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            console.error("Got error for GET request to /new_grid")
            return { err: response.status, message: `HTTP error ${response.status}` };
        }

        const data = await response.json();
        console.log("Got response for GET request to /new_grid")
        return { ...data, err: 0 };
    } catch (err) {
        return { err: -1, message: err.message || 'Network error' };
    }
}

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
