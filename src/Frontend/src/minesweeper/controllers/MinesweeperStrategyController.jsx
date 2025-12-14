import {useCallback} from "react";
import {useLocation, useNavigate} from "react-router-dom";

export function MinesweeperStrategyController() {
    const navigate = useNavigate();
    const location = useLocation();

    // Settings passed from location state (if any)
    const existingGameId = location?.state?.existingGameId;
    const fromGame = location?.state?.fromGame;

    const onBack = useCallback(() => {
        // If coming from game, navigate back to it
        if(fromGame) {
            navigate("/minesweeper", {state: {id: existingGameId}});
            return;
        }

        // Else, navigate to home
        navigate("/", {replace: true});
    }, [navigate, fromGame, existingGameId]);

    return {
        // Incoming from game
        fromGame,

        // Navigation
        onBack
    };
}
