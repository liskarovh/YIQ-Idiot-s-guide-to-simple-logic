from __future__ import annotations
from copy import deepcopy
from typing import Optional, Dict, Any
import random
import time

from .models.game import Game
from .models.move import Move
from .models.snapshot import BoardSnapshot
from .models.player import Player

from . import rules
from . import store as mem_store
from .adapter import compute_best_move

_MEM: Dict[str, Game] = {}


def _store_get(game_id: str) -> Optional[Game]:
    if hasattr(mem_store, "get"):
        return mem_store.get(game_id)
    if hasattr(mem_store, "load"):
        return mem_store.load(game_id)
    if hasattr(mem_store, "get_game"):
        return mem_store.get_game(game_id)
    return _MEM.get(game_id)


def _store_save(game: Game) -> None:
    if hasattr(mem_store, "save"):
        mem_store.save(game); return
    if hasattr(mem_store, "put"):
        mem_store.put(game.id, game); return
    if hasattr(mem_store, "set"):
        mem_store.set(game.id, game); return
    if hasattr(mem_store, "save_game"):
        mem_store.save_game(game); return
    _MEM[game.id] = game


def _make_id() -> str:
    return f"{int(time.time() * 1000)}-{random.randint(1000, 9999)}"


def _empty_board(n: int):
    return [["." for _ in range(n)] for _ in range(n)]


def _normalize_mode(m: Optional[str]) -> str:
    if not isinstance(m, str):
        return "pve"
    m_lower = m.strip().lower()
    if m_lower in ("pvp", "pv p", "player-vs-player"):
        return "pvp"
    if m_lower in ("pve", "pv e", "player-vs-engine", "player-vs-ai"):
        return "pve"
    return "pve"


def get_game(game_id: str) -> Optional[Game]:
    return _store_get(game_id)


def save_game(game: Game) -> None:
    _store_save(game)


def _move_to_dict(m: Any) -> dict:
    if hasattr(m, "to_dict"):
        return m.to_dict()
    return {
        "row": getattr(m, "row", None),
        "col": getattr(m, "col", None),
        "mark": getattr(m, "mark", getattr(m, "player", None)),
    }


def to_dto(g: Game) -> dict:
    snaps = []
    for s in getattr(g, "snapshots", []):
        snaps.append({"ply": int(getattr(s, "ply", 0))})
    hints = int(getattr(g, "hints_used", 0))

    # --- timeElapsedMs: od startu do teď, resp. do ended_at ---
    t0 = float(getattr(g, "created_at", 0) or 0.0)
    t1 = float(getattr(g, "ended_at", 0) or 0.0)
    now = time.time()
    if t0 > 0:
        if t1 and t1 >= t0:
            elapsed_ms = int((t1 - t0) * 1000)
        else:
            elapsed_ms = int((now - t0) * 1000)
    else:
        elapsed_ms = 0

    return {
        "id": g.id,
        "size": g.size,
        "k_to_win": g.k_to_win,
        "goal": g.k_to_win,          # alias očekávaný testem
        "board": g.board,
        "player": g.player,
        "status": g.status,
        "winner": g.winner,
        "history": [_move_to_dict(m) for m in g.history],
        "snapshots": snaps,
        "mode": g.mode,
        "start_mark": g.start_mark,
        "human_mark": g.human_mark,
        "difficulty": g.difficulty,
        "turnTimerSec": g.turn_timer_s if g.turn_timer_s is not None else 0,
        "hintsUsed": hints,
        "hints_used": hints,     # snake_case kvůli testu
        "moves": len(g.history), # vyžadováno testem
        "timeElapsedMs": elapsed_ms,
    }


def new_game(
    *,
    size: int,
    k_to_win: int,
    start_mark: str | None = None,
    human_mark: str | None = None,
    mode: str | None = None,
    turn_timer_s: int | None = None,
    difficulty: str | None = None,
) -> Game:
    board = _empty_board(size)

    sm_raw = (start_mark or "X")
    sm_upper = str(sm_raw).strip().upper()
    random_pick = (sm_upper == "RANDOM")
    if random_pick:
        sm = random.choice(["X", "O"])
    else:
        sm = sm_upper if sm_upper in ("X", "O") else "X"

    mode_norm = _normalize_mode(mode or "pve")
    hm = (human_mark or "X") if mode_norm == "pve" else None

    diff = (difficulty or "easy").strip().lower()
    if diff not in ("easy", "medium", "hard"):
        diff = "easy"

    players = {"X": Player("X"), "O": Player("O")}

    g = Game(
        id=_make_id(),
        size=size,
        k_to_win=k_to_win,
        board=board,
        player=sm,
        status="running",
        winner=None,
        history=[],
        snapshots=[],
        mode=mode_norm,
        start_mark=sm,
        human_mark=hm,
        players=players,
        turn_timer_s=turn_timer_s or 0,
        created_at=time.time(),
        ended_at=None,
        hints_used=0,
        difficulty=diff,
    )

    g.snapshots.append(BoardSnapshot(
        ply=0,
        board=deepcopy(g.board),
        last_move=None
    ))

    if (g.mode == "pve"
        and g.human_mark in ("X", "O")
        and g.player != g.human_mark
        and not random_pick):
        bm = compute_best_move(g.board, g.player, g.size, g.k_to_win, difficulty=g.difficulty)
        r, c = bm["move"]
        g = apply_move(g, r, c)

    save_game(g)
    return g


def apply_move(g: Game, row: int, col: int) -> Game:
    mark = g.player
    g.board[row][col] = mark

    try:
        g.history.append(Move(row=row, col=col, mark=mark))
    except TypeError:
        try:
            g.history.append(Move(row=row, col=col, player=mark))
        except Exception:
            class _MoveLite:
                __slots__ = ("row", "col", "mark")
                def __init__(self, r, c, m): self.row, self.col, self.mark = r, c, m
            g.history.append(_MoveLite(row, col, mark))

    term = rules.check_winner(g.board, g.k_to_win)
    if term is None:
        next_player = "O" if g.player == "X" else "X"
        try:
            lm = Move(row=row, col=col, mark=mark)
        except TypeError:
            try:
                lm = Move(row=row, col=col, player=mark)
            except Exception:
                class _MoveLite:
                    __slots__ = ("row", "col", "mark")
                    def __init__(self, r, c, m): self.row, self.col, self.mark = r, c, m
                lm = _MoveLite(row, col, mark)

        g.snapshots.append(BoardSnapshot(
            ply=len(g.history),
            board=deepcopy(g.board),
            last_move=lm,
        ))
        g.player = next_player
    else:
        g.status = "win" if term in ("X", "O") else "draw"
        g.winner = term if g.status == "win" else None
        g.ended_at = time.time()

        try:
            lm = Move(row=row, col=col, mark=mark)
        except TypeError:
            try:
                lm = Move(row=row, col=col, player=mark)
            except Exception:
                class _MoveLite:
                    __slots__ = ("row", "col", "mark")
                    def __init__(self, r, c, m): self.row, self.col, self.mark = r, c, m
                lm = _MoveLite(row, col, mark)

        g.snapshots.append(BoardSnapshot(
            ply=len(g.history),
            board=deepcopy(g.board),
            last_move=lm,
        ))

    save_game(g)
    return g


def finish_game(g: Game) -> None:
    g.ended_at = time.time()
    save_game(g)


# --- AI autoplay helpers (PvE) ---

def _is_ai_turn(g: Game) -> bool:
    # PvE, definovaný human_mark, hra běží a na tahu je „ne-human“ (AI)
    return (
        g.mode == "pve"
        and getattr(g, "human_mark", None) in ("X", "O")
        and g.status == "running"
        and g.player != g.human_mark
    )

def maybe_ai_autoplay(g: Game, *, difficulty: str | None = None) -> Game:
    """
    Pokud je po hráčově tahu na řadě AI, spočítá nejlepší tah a ihned ho provede.
    Vrací aktualizovanou hru (stejnou referenci).
    """
    if not _is_ai_turn(g):
        return g

    diff = (difficulty or getattr(g, "difficulty", "easy") or "easy").lower()
    try:
        bm = compute_best_move(g.board, g.player, g.size, g.k_to_win, difficulty=diff)
        r, c = bm["move"]
        g = apply_move(g, r, c)
    finally:
        # jistota uložení; apply_move už ukládá, ale kdybychom autoplays rozšířili, necháváme zde
        save_game(g)
    return g

