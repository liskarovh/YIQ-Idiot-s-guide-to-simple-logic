/**
 * @file MinesweeperGameRenderHelpers.jsx
 * @brief Helper functions for rendering and formatting in the Minesweeper game.
 *
 * @author Jan Kalina \<xkalinj00>
 */

export const formatTime = (sec = 0) => {
    sec = Math.max(0, Math.floor(sec));

    const days = Math.floor(sec / 86400);
    sec %= 86400;

    const hours = Math.floor(sec / 3600);
    sec %= 3600;

    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;

    if(days > 0) {
        return `${days}d ${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    if(hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const normalizeView = (data) => {
    if(!data || !data.board) {
        return null;
    }
    const board = data.board ?? {};
    return {
        ...data,
        board: {
            opened: board.opened ?? [],
            flagged: board.flagged ?? [],
            mines: board.mines ?? [],
            permanentFlags: board.permanentFlags ?? [],
            lostOn: board.lostOn ?? null
        }
    };
};
