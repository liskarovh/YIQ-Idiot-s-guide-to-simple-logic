# src/Backend/tic_tac_toe/adapter.py
from __future__ import annotations
import time
from typing import List, Tuple, Optional
from .config import difficulty_params, TIMEOUT_MS, ENGINE_VERSION

class EngineTimeout(Exception):
    pass

def _first_empty(board: List[List[str]]) -> Optional[Tuple[int, int]]:
    for r, row in enumerate(board):
        for c, v in enumerate(row):
            if v == ".":
                return r, c
    return None

def _centerish(board: List[List[str]]) -> Optional[Tuple[int, int]]:
    n = len(board)
    center = (n // 2, n // 2)
    best = None
    best_dist = 10**9
    for r in range(n):
        for c in range(n):
            if board[r][c] == ".":
                dist = abs(r - center[0]) + abs(c - center[1])
                if dist < best_dist:
                    best_dist = dist
                    best = (r, c)
    return best

def compute_best_move(
    board: List[List[str]],
    player: str,
    size: int,
    k_to_win: int,
    *,
    difficulty: str = "easy",
    time_cap_ms: int | None = None
) -> dict:
    # plán z konfigurace obtížností
    plan = difficulty_params(difficulty)
    time_cap = int(time_cap_ms) if (time_cap_ms is not None) else TIMEOUT_MS

    t0 = time.perf_counter()

    # TODO: napojení na „těžký“ engine (MCTS apod.)
    # try:
    #     move, score, used_rollouts = heavy_solve(..., rollouts=plan.rollouts, limit_ms=time_cap)
    #     ...
    # except TimeoutError as ex:
    #     raise EngineTimeout(str(ex))

    # Fallback: rychlá deterministická heuristika
    move = _centerish(board) or _first_empty(board) or (0, 0)
    elapsed = int((time.perf_counter() - t0) * 1000)

    return {
        "move": [int(move[0]), int(move[1])],
        "score": 0.0,
        "explain": f"fallback=centerish; size={size}; k={k_to_win}; player={player}; diff={difficulty}; rollouts={plan.rollouts}; greedy={plan.greedy}; capMs={time_cap}",
        "stats": {"elapsedMs": elapsed, "rollouts": int(plan.rollouts)},
        "version": ENGINE_VERSION,
    }
