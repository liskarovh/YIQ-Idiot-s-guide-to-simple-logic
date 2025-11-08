import React, { useState, useEffect } from 'react';

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
};

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
