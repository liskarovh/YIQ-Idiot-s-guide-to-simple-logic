// minesweeper/components/MinesweeperGameComponents/Icons.jsx
import React from "react";

export const IHint = (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 3a7 7 0 017 7c0 2.6-1.5 4.6-3.5 5.8V19a1 1 0 01-1 1h-5a1 1 0 01-1-1v-3.2A6.9 6.9 0 015 10a7 7 0 017-7z" stroke="white"/>
            <path d="M9 22h6" stroke="white"/>
        </svg>
);

export const IPause = (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M7 4h4v16H7zM13 4h4v16h-4z" />
        </svg>
);

export const IPlay = (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M8 5l12 7-12 7z" />
        </svg>
);

export const IUndo = (
        <svg width="28" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M7 7l-4 4 4 4" stroke="white" />
            <path d="M3 11h10a5 5 0 110 10h-2" stroke="white" />
        </svg>
);

export const IFlag = (
        <svg width="28" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M5 3v18" stroke="white" />
            <path d="M7 4h9l-2 4 2 4H7z" fill="white" />
        </svg>
);

export const IDrag = (
        <svg width="28" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M4 10h16M4 14h16" stroke="white" />
            <circle cx="7" cy="7" r="1.5" fill="white" />
            <circle cx="7" cy="17" r="1.5" fill="white" />
        </svg>
);
