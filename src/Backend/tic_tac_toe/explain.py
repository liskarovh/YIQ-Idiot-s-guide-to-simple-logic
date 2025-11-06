# src/Backend/react/explain.py
from __future__ import annotations
from typing import List, Tuple, Dict, Any, Optional, Literal, cast
from copy import deepcopy
from collections import defaultdict

from . import rules

# Directions: horizontal, vertical, and both diagonals
DIRECTIONS = [(0, 1), (1, 0), (1, 1), (1, -1)]  # type: List[Tuple[int, int]]

# Hezké popisky směrů
DIR_LABELS = {
    (0, 1): "horizontal",
    (1, 0): "vertical",
    (1, 1): "diagonal ↘",
    (1, -1): "diagonal ↗",
    (0, -1): "horizontal",
    (-1, 0): "vertical",
    (-1, 1): "diagonal ↗",
    (-1, -1): "diagonal ↘",
}


def _pretty_dir(d):
    try:
        return DIR_LABELS.get((int(d[0]), int(d[1])), f"dir{tuple(d)}")
    except Exception:
        return f"dir{tuple(d)}"


def _collapse_extend_reasons(reasons: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sloučí všechny 'extend' důvody se stejným (run, openEnds) do jednoho
    a do textu doplní seznam směrů. Ostatní typy ponechá beze změny.
    """
    grouped = defaultdict(lambda: {"dirs": [], "sample": None})
    rest: List[Dict[str, Any]] = []
    for r in reasons:
        if r.get("type") == "extend":
            key = (r.get("run"), r.get("openEnds"))
            grouped[key]["dirs"].append(r.get("dir"))
            grouped[key]["sample"] = r
        else:
            rest.append(r)

    collapsed: List[Dict[str, Any]] = []
    for (run, oe), g in grouped.items():
        dirs = [_pretty_dir(d) for d in g["dirs"] if d is not None]
        dirs_txt = ", ".join(sorted(set(dirs))) if dirs else None
        text = f"Extends line to {run} ({oe} open end{'s' if oe != 1 else ''})"
        if dirs_txt:
            text += f" in {dirs_txt}."
        else:
            text += "."
        collapsed.append({
            "type": "extend",
            "run": run,
            "openEnds": oe,
            "dirs": g["dirs"],  # surové směry pro UI (volitelné)
            "text": text,
        })

    # sloučené extend + nespadající zbytek
    return collapsed + rest


def _in(n: int, r: int, c: int) -> bool:
    return 0 <= r < n and 0 <= c < n


def _simulate(board: List[List[str]], r: int, c: int, mark: str) -> List[List[str]]:
    b2 = deepcopy(board)
    b2[r][c] = mark
    return b2


def _count_one_side(board: List[List[str]], r: int, c: int, dr: int, dc: int, mark: str) -> int:
    n = len(board)
    rr, cc = r + dr, c + dc
    cnt = 0
    while _in(n, rr, cc) and board[rr][cc] == mark:
        cnt += 1
        rr += dr
        cc += dc
    return cnt


def _open_end(board: List[List[str]], r: int, c: int, dr: int, dc: int) -> bool:
    n = len(board)
    rr, cc = r + dr, c + dc
    return _in(n, rr, cc) and board[rr][cc] == "."


def _line_stats_after_move(board: List[List[str]], r: int, c: int, mark: str) -> Dict[str, Any]:
    """
    Line statistics across all 4 directions after playing (r, c).
    """
    out: List[Dict[str, Any]] = []
    for (dr, dc) in DIRECTIONS:
        left = _count_one_side(board, r, c, -dr, -dc, mark)
        right = _count_one_side(board, r, c, dr, dc, mark)
        run_len = left + 1 + right
        open_left = _open_end(board, r, c, -dr, -dc)
        open_right = _open_end(board, r, c, dr, dc)
        out.append({
            "dir": (dr, dc),
            "run": run_len,
            "open_ends": int(open_left) + int(open_right),
            "sides": {
                "left": left,
                "right": right,
                "open_left": open_left,
                "open_right": open_right
            }
        })
    best_run = max(d["run"] for d in out) if out else 1
    open_runs = sum(1 for d in out if d["run"] >= 2)
    return {"dirs": out, "best_run": best_run, "open_runs": open_runs}


def _opponent(mark: str) -> str:
    return "O" if mark == "X" else "X"


def _find_opponent_immediate_wins(board: List[List[str]], k: int, opp: str) -> List[Tuple[int, int]]:
    """
    All empty cells where the opponent wins immediately in one move.
    """
    n = len(board)
    wins = []  # type: List[Tuple[int, int]]
    for r in range(n):
        for c in range(n):
            if board[r][c] != ".":
                continue
            b2 = _simulate(board, r, c, opp)
            term = rules.check_winner(cast(List[List[Literal[".", "X", "O"]]], b2), k)
            if term == opp:
                wins.append((r, c))
    return wins


def _creates_double_threat(board: List[List[str]], r: int, c: int, mark: str, k: int) -> bool:
    """
    After our move there are at least two independent “win-next-move” threats.
    A coarse but fast approximation.
    """
    n = len(board)
    b2 = _simulate(board, r, c, mark)
    threats = 0
    for (dr, dc) in DIRECTIONS:
        # to the "left"
        left = 0
        rr, cc = r - dr, c - dc
        while _in(n, rr, cc) and b2[rr][cc] == mark:
            left += 1
            rr -= dr
            cc -= dc
        # to the "right"
        right = 0
        rr, cc = r + dr, c + dc
        while _in(n, rr, cc) and b2[rr][cc] == mark:
            right += 1
            rr += dr
            cc += dc

        run = left + 1 + right
        # “k-1 and at least one open end” ~ we can win next move in this direction
        ol_r = r - (dr * (left + 1))
        ol_c = c - (dc * (left + 1))
        or_r = r + (dr * (right + 1))
        or_c = c + (dc * (right + 1))
        open_left = _in(n, ol_r, ol_c) and b2[ol_r][ol_c] == "."
        open_right = _in(n, or_r, or_c) and b2[or_r][or_c] == "."
        if run == k - 1 and (open_left or open_right):
            threats += 1
    return threats >= 2


def build_explanation(
    board: List[List[str]],
    move: Optional[Tuple[int, int]],
    player: str,
    size: int,
    k: int
) -> Dict[str, Any]:
    """
    Returns explainRich = {'summary': str, 'reasons': [...], 'winningSequence': [...], 'hints': {...}}
    """
    if not move or not isinstance(move, (list, tuple)) or len(move) != 2:
        return {"summary": "No move suggested.", "reasons": [], "winningSequence": [], "hints": {}}

    r, c = int(move[0]), int(move[1])
    opp = _opponent(player)
    reasons: List[Dict[str, Any]] = []

    # 1) Immediate win?
    b_win = _simulate(board, r, c, player)
    term = rules.check_winner(cast(List[List[Literal[".", "X", "O"]]], b_win), k)
    if term == player:
        try:
            seq = rules.find_winning_sequence(cast(List[List[Literal[".", "X", "O"]]], b_win), k)
        except Exception:
            seq = [[r, c]]
        reasons.append({"type": "win_now", "text": "Immediate win.", "cells": seq})
        return {
            "summary": "Immediate win.",
            "reasons": reasons,
            "winningSequence": seq,
            "hints": {"category": "win"}
        }

    # 2) Blocks opponent’s immediate win?
    opp_wins = _find_opponent_immediate_wins(board, k, opp)
    if (r, c) in opp_wins:
        reasons.append({
            "type": "block",
            "text": "Blocks the opponent’s immediate win.",
            "cells": [(r, c)]
        })

    # 3) Line structure after the move
    stats = _line_stats_after_move(b_win, r, c, player)
    best_run = int(stats.get("best_run", 1))
    dirs = stats.get("dirs", [])
    for d in dirs:
        run = int(d.get("run", 1))
        if run >= 2:
            opened = int(d.get("open_ends", 0))
            if opened == 2:
                suffix = "2 open ends"
            elif opened == 1:
                suffix = "1 open end"
            else:
                suffix = "no open ends"
            txt = f"Extends a line to {run} ({suffix})."
            reasons.append({
                "type": "extend",
                "dir": d.get("dir"),
                "run": run,
                "openEnds": opened,
                "text": txt
            })

    # 4) Double threat?
    if _creates_double_threat(board, r, c, player, k):
        reasons.append({
            "type": "double_threat",
            "text": "Creates a double threat (two ways to win on the next move).",
            "cells": [(r, c)]
        })

    # 5) Center control (soft UX heuristic)
    center = (size - 1) / 2.0
    dist = max(abs(r - center), abs(c - center))
    if dist <= size * 0.25:
        reasons.append({
            "type": "center",
            "text": "Controlling the center increases flexibility for future lines.",
            "cells": [(r, c)]
        })

    # 6) Sloučit podobné "extend" důvody
    reasons = _collapse_extend_reasons(reasons)

    # 7) Summary (priorita důvodů)
    if reasons:
        prio = {"block": 0, "double_threat": 1, "extend": 2, "center": 3, "win_now": -1}
        reasons.sort(key=lambda x: prio.get(x.get("type", "extend"), 99))
        lead = reasons[0]["text"]
    else:
        lead = "The position improves future chances with no immediate threats."

    return {
        "summary": lead,
        "reasons": reasons,
        "winningSequence": [],
        "hints": {
            "bestRun": best_run,
            "distanceFromCenterChebyshev": float(dist),
        }
    }
