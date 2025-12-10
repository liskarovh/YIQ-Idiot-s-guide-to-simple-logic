export const formatTime = (sec = 0) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
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
