import {useEffect, useMemo, useState} from "react";

export function useGameTimer({view, showTimer, paused, isExploded, isGameOver}) {
    const [timerSec, setTimerSec] = useState(view?.elapsedTime ?? 0);

    // Sync timer from server
    useEffect(() => {
        if(view?.elapsedTime !== undefined) {
            setTimerSec(view.elapsedTime);
        }
    }, [view?.elapsedTime]);

    // Run interval only when needed
    useEffect(() => {
        const shouldRun = showTimer && !paused && view?.status === "playing" && !isExploded && !isGameOver;
        if(!shouldRun) {
            return;
        }
        const timer = setInterval(() => setTimerSec((s) => s + 1), 1000);
        return () => clearInterval(timer);
    }, [showTimer, paused, view?.status, isExploded, isGameOver]);

    return [timerSec, setTimerSec];
}

export function useExplosionMode(view, initial = false) {
    const [explodedMode, setExplodedMode] = useState(initial);

    // Manages "exploded" mode when player hits a mine but has lives left
    useEffect(() => {
        const lostOn = !!view?.board?.lostOn;           // Cell where the player lost
        const livesTotal = view?.lives?.total ?? 0;     // Total lives for the game
        const livesLeft = view?.lives?.left ?? 0;       // Lives left after the hit

        // Determine if we should enter exploded mode
        const shouldEnter = lostOn && ((livesTotal > 0 && livesLeft > 0) || (livesTotal === 0 && livesLeft === 0));
        if(shouldEnter && !explodedMode) {
            setExplodedMode(true);
            return;
        }

        // Determine if we should exit exploded mode
        const shouldExit = explodedMode && !view?.isPreview && !lostOn && view?.status === "playing";
        if(shouldExit) {
            setExplodedMode(false);
        }
    }, [view?.board?.lostOn, view?.lives?.total, view?.lives?.left, view?.status, view?.isPreview, explodedMode]);

    return [explodedMode, setExplodedMode];
}

export function useDerivedGameState({view, paused, busy, explodedMode}) {
    return useMemo(() => {
        // Game state before first reveal
        const beforeStart = view?.status === "new";

        // Game over state, when won or lost
        const isGameOver = view?.status === "lost" || view?.status === "won";

        // Exploded mode state, when player hit a mine but has lives left
        const isExploded = explodedMode;

        // Determine available actions
        const canReveal = !paused && !isGameOver && !busy && !isExploded;
        const canFlag = !paused && !isGameOver && !busy && !isExploded && !beforeStart;
        const canUseActions = canFlag;

        // Mines and flags info
        const flaggedCount = view?.board?.flagged?.length ?? 0;
        const permanentFlagsSet = new Set((view?.board?.permanentFlags || []).map(({r, c}) => `${r},${c}`));
        const minesRemaining = Math.max(0, (view?.mines ?? 0) - flaggedCount);

        // Lives (hearts) info
        const totalLives = view?.lives?.total ?? 0;
        const livesLeft = view?.lives?.left ?? 0;
        const hearts = Array.from({length: totalLives}, (_, i) => i < livesLeft);

        return {
            beforeStart,
            isGameOver,
            isExploded,
            canReveal,
            canFlag,
            canUseActions,
            flaggedCount,
            minesRemaining,
            hearts,
            permanentFlagsSet
        };
    }, [paused, busy, explodedMode, view?.status, view?.board?.flagged?.length, view?.mines, view?.lives?.total, view?.lives?.left, view?.board?.permanentFlags]);
}
