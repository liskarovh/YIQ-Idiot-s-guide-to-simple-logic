from __future__ import annotations
from copy import deepcopy
from typing import Optional, Dict, Any, Iterable, Tuple, Literal
import random
import time

from .models.game import Game
from .models.move import Move
from .models.snapshot import BoardSnapshot
from .models.player import Player

from . import rules
from . import store as mem_store
from .adapter import compute_best_move

# In-memory fallback
_MEM: Dict[str, Game] = {}

# ───────────────────────── constants ─────────────────────────
SIZE_MIN, SIZE_MAX = 3, 8
K_MIN,   K_MAX     = 3, 5


# ───────────────────────── storage helpers ─────────────────────────

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


# ───────────────────────── utils ─────────────────────────

def _make_id() -> str:
    return f"{int(time.time() * 1000)}-{random.randint(1000, 9999)}"


def _empty_board(n: int):
    return [["." for _ in range(n)] for _ in range(n)]


def _normalize_mode(m: Optional[str]) -> str:
    if not isinstance(m, str):
        return "pve"
    m_lower = m.strip().lower()
    if m_lower in ("pvp", "pv p", "player-vs-player", "2p", "two-players"):
        return "pvp"
    if m_lower in ("pve", "pv e", "player-vs-engine", "player-vs-ai", "bot"):
        return "pve"
    return "pve"


def _normalize_difficulty(d: Optional[str]) -> str:
    d2 = (d or "easy").strip().lower()
    return d2 if d2 in ("easy", "medium", "hard") else "easy"


def _clamp_params(size_raw: int, k_raw: int) -> tuple[int, int]:
    size = max(SIZE_MIN, min(int(size_raw), SIZE_MAX))
    k_to_win = max(K_MIN, min(int(k_raw), size, K_MAX))
    return size, k_to_win


def _kind_for(mark: str, *, mode: str, human_mark: Optional[str]) -> Literal["human", "ai"]:
    """
    V PvE je 'ai' ten, kdo není human_mark. V PvP jsou oba 'human'.
    """
    if mode == "pve" and human_mark in ("X", "O"):
        return "human" if mark == human_mark else "ai"
    return "human"


def _extract_nickname(v: Any) -> Optional[str]:
    """
    Vytáhni nickname z různých tvarů:
    - str → přímá hodnota
    - dict → ['nickname'] / ['name'] / ['nick']
    - Player → .nickname
    - jinak None
    """
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return v.get("nickname") or v.get("name") or v.get("nick")
    if isinstance(v, Player):
        return getattr(v, "nickname", None)
    return None


def _sanitize_nick(n: Optional[str], default_: str, *, max_len: int = 30) -> str:
    n = (n or "").strip().replace("\n", " ")
    if not n:
        return default_
    if len(n) > max_len:
        return n[:max_len]
    return n


def _build_players_from_payload(
    *,
    mode: str,
    human_mark: Optional[str],
    payload_players: Optional[dict],
    player_name_fallback: Optional[str],
) -> Dict[str, Player]:
    """
    Připrav slovník {'X': Player, 'O': Player} z FE payloadu.
    - preferuje players.{x,o} (lowercase), přijme i {X,O} (uppercase)
    - akceptuje string / dict / Player
    - pro X fallback na playerName
    - pro O fallback 'Computer' v PvE, jinak 'Player2'
    """
    p = payload_players or {}
    raw_x = p.get("x") or p.get("X")
    raw_o = p.get("o") or p.get("O")

    nick_x_src = _extract_nickname(raw_x) or player_name_fallback
    nick_o_src = _extract_nickname(raw_o)

    nick_x = _sanitize_nick(nick_x_src, "Player1")
    nick_o = _sanitize_nick(nick_o_src, "Computer" if mode == "pve" else "Player2")

    return {
        "X": Player(id="X", nickname=nick_x, kind=_kind_for("X", mode=mode, human_mark=human_mark)),
        "O": Player(id="O", nickname=nick_o, kind=_kind_for("O", mode=mode, human_mark=human_mark)),
    }


# ───────────────── tactics / legality / diagnostics ─────────────────

def _legal(board: list[list[str]], r: int, c: int) -> bool:
    n = len(board)
    return 0 <= r < n and 0 <= c < n and board[r][c] == "."


def _legal_moves(board: list[list[str]]) -> Iterable[Tuple[int, int]]:
    n = len(board)
    for r in range(n):
        for c in range(n):
            if board[r][c] == ".":
                yield (r, c)


def _winning_move(board: list[list[str]], mark: str, k: int) -> Optional[Tuple[int, int]]:
    """Najdi okamžitou výhru pro `mark` (1 tah)."""
    for r, c in _legal_moves(board):
        board[r][c] = mark
        try:
            if rules.check_winner(board, k) == mark:
                return (r, c)
        finally:
            board[r][c] = "."
    return None


def _diagnose_mapping(board: list[list[str]], move: Tuple[int, int]) -> Dict[str, Tuple[int, int]]:
    """Když engine vrátí nelegální tah, otestuj běžné transformace (swap/flip/rotace)."""
    n = len(board)
    r, c = int(move[0]), int(move[1])
    candidates = {
        "identity": (r, c),
        "swap": (c, r),
        "flipV": (n - 1 - r, c),
        "flipH": (r, n - 1 - c),
        "rot90": (c, n - 1 - r),
        "rot180": (n - 1 - r, n - 1 - c),
        "rot270": (n - 1 - c, r),
    }
    return {k: v for k, v in candidates.items() if _legal(board, *v)}


def _assert_turn_consistency(board: list[list[str]], player: str, start_mark: str) -> None:
    """Tvrdě zkontroluj, že `player` souhlasí s paritou X/O a startem."""
    x = sum(row.count("X") for row in board)
    o = sum(row.count("O") for row in board)
    if start_mark == "X":
        expected = "X" if x == o else "O"
    else:
        expected = "O" if x == o else "X"
    assert player == expected, (
        f"Turn mismatch: player={player}, expected={expected}, counts={{'X':{x},'O':{o}}}, start={start_mark}"
    )


def _pick_ai_move_safe(
    board: list[list[str]],
    ai_mark: str,
    human_mark: str,
    size: int,
    k: int,
    difficulty: str,
    precomputed_engine_move: Optional[Tuple[int, int]] = None,
) -> Tuple[int, int]:
    """
    Bezpečný výběr tahu:
      1) vyhraj hned,
      2) zablokuj soupeřovu okamžitou výhru,
      3) použij engine (pokud je předpočítaný, použij ten),
      3a) pokud engine vrátí nelegální souřadnice, oprav mapping, jinak první volné pole.
    """
    # 1) win-now
    m = _winning_move(board, ai_mark, k)
    if m:
        return m

    # 2) block-now
    m = _winning_move(board, human_mark, k)
    if m:
        return m

    # 3) engine (předpočítaný, nebo zavolej adapter)
    if precomputed_engine_move is not None:
        r, c = int(precomputed_engine_move[0]), int(precomputed_engine_move[1])
    else:
        bm = compute_best_move(board, ai_mark, size, k, difficulty=difficulty)
        r, c = int(bm["move"][0]), int(bm["move"][1])

    # 3a) pojistka legality + mapping diagnostika
    if not _legal(board, r, c):
        fixes = _diagnose_mapping(board, (r, c))
        if fixes:
            r, c = next(iter(fixes.values()))
        else:
            # naprosto krajní fallback – první volné pole
            r, c = next(_legal_moves(board))

    return (r, c)


# ───────────────────────── win helpers ─────────────────────────

def _winning_sequence_for(g: Game) -> list[dict]:
    """Vypočti výherní postupku pro aktuální board (právě k buněk), nebo []"""
    try:
        return rules.find_winning_sequence(g.board, g.k_to_win)
    except Exception:
        return []


def _status_and_winner_for(g: Game) -> tuple[str, Optional[str]]:
    """
    Normalizuj top-level status ('running' | 'win' | 'draw') a winner ('X'|'O'|None)
    z reálného stavu desky (nezávisle na tom, co je v g.status/g.winner).
    """
    term = rules.check_winner(g.board, g.k_to_win)
    if term in ("X", "O"):
        return "win", term
    if term == "draw":
        return "draw", None
    return "running", None


# ───────────────────────── public store API ─────────────────────────

def get_game(game_id: str) -> Optional[Game]:
    return _store_get(game_id)


def save_game(game: Game) -> None:
    _store_save(game)


# ───────────────────────── DTO ─────────────────────────

def _move_to_dict(m: Any) -> dict:
    if hasattr(m, "to_dict"):
        return m.to_dict()
    return {
        "row": getattr(m, "row", None),
        "col": getattr(m, "col", None),
        "mark": getattr(m, "mark", getattr(m, "player", None)),
    }


def to_dto(g: Game) -> dict:
    snaps = [{"ply": int(getattr(s, "ply", 0))} for s in getattr(g, "snapshots", [])]
    hints = int(getattr(g, "hints_used", 0))

    # --- timeElapsedMs: od startu do teď, resp. do ended_at ---
    t0 = float(getattr(g, "created_at", 0) or 0.0)
    t1 = float(getattr(g, "ended_at", 0) or 0.0)
    now = time.time()
    if t0 > 0:
        elapsed_ms = int(((t1 if (t1 and t1 >= t0) else now) - t0) * 1000)
    else:
        elapsed_ms = 0

    # --- players (pro FE: id, nickname, kind) ---
    px = g.players.get("X") if g.players else None
    po = g.players.get("O") if g.players else None
    players_dto = {
        "X": {
            "id": "X",
            "nickname": getattr(px, "nickname", None),
            "kind": getattr(px, "kind", "human"),
        } if px else {"id": "X", "nickname": None, "kind": "human"},
        "O": {
            "id": "O",
            "nickname": getattr(po, "nickname", None),
            "kind": getattr(po, "kind", "human"),
        } if po else {"id": "O", "nickname": None, "kind": "human"},
    }

    # NEW: spočti výherní postupku (prázdné pole pokud není výhra)
    winning_seq = _winning_sequence_for(g)

    return {
        "id": g.id,
        "size": g.size,
        "k_to_win": g.k_to_win,
        "goal": g.k_to_win,          # alias očekávaný některými testy
        "board": g.board,
        "player": g.player,
        "status": g.status,
        "winner": g.winner,
        "history": [_move_to_dict(m) for m in g.history],
        "snapshots": snaps,
        "mode": g.mode,
        "start_mark": g.start_mark,
        "human_mark": g.human_mark,
        "players": players_dto,
        "turnTimerSec": g.turn_timer_s if g.turn_timer_s is not None else 0,
        "hintsUsed": hints,
        "hints_used": hints,     # snake_case kvůli starším testům
        "moves": len(g.history),
        "timeElapsedMs": elapsed_ms,
        "difficulty": g.difficulty,
        "winningSequence": winning_seq,  # ← NEW (uvnitř "game")
    }


def to_response(g: Game) -> dict:
    """
    Kompletní odpověď pro API:
    - "game": ... (stávající DTO, nově i s game.winningSequence)
    - top-level "status" | "winner" | "winningSequence" (pro snadné čtení na FE)
    - pokud poslední /play zahrnul autoplay bota, přidej "ai" a "aiMove"
    """
    status, winner = _status_and_winner_for(g)
    winning_seq = _winning_sequence_for(g)

    ret = {
        "game": to_dto(g),
        "status": status,
        "winner": winner,
        "winningSequence": winning_seq,
    }

    ai = getattr(g, "_last_ai", None)
    if isinstance(ai, dict) and "move" in ai:
        ret["ai"] = ai
        ret["aiMove"] = ai.get("move")

    return ret


# ───────────────────────── game creation ─────────────────────────

def new_game_from_payload(payload: dict) -> Game:
    """
    Bezpečný wrapper pro JSON z FE (camelCase → snake_case + players/nicknames).
    """
    size_raw       = int(payload.get("size", 3))
    k_raw          = int(payload.get("kToWin", payload.get("k_to_win", size_raw)))
    size, k_to_win = _clamp_params(size_raw, k_raw)

    start_mark    = payload.get("startMark")
    human_mark    = payload.get("humanMark")
    mode          = payload.get("mode")
    turn_timer_s  = int(payload.get("turnTimerSec", payload.get("turn_timer_s", 0)) or 0)
    difficulty    = _normalize_difficulty(payload.get("difficulty"))
    players       = payload.get("players")
    player_name   = payload.get("playerName")  # fallback pro X

    return new_game(
        size=size,
        k_to_win=k_to_win,
        start_mark=start_mark,
        human_mark=human_mark,
        mode=mode,
        turn_timer_s=turn_timer_s,
        difficulty=difficulty,
        players=players,
        player_name=player_name,
    )


def new_game(
    *,
    size: int,
    k_to_win: int,
    start_mark: str | None = None,
    human_mark: str | None = None,
    mode: str | None = None,
    turn_timer_s: int | None = None,
    difficulty: str | None = None,
    players: Optional[dict] = None,
    player_name: Optional[str] = None,
) -> Game:
    # finální clamp (i kdyby wrapper nebyl použit)
    size, k_to_win = _clamp_params(size, k_to_win)

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

    diff = _normalize_difficulty(difficulty)

    # players: naplň z FE (+ fallbacky)
    players_dict = _build_players_from_payload(
        mode=mode_norm,
        human_mark=hm,
        payload_players=players,
        player_name_fallback=player_name,
    )

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
        players=players_dict,
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

    # Autoplay prvního tahu, pokud začíná AI (PvE) a start není random
    if (
        g.mode == "pve"
        and g.human_mark in ("X", "O")
        and g.player != g.human_mark
        and not random_pick
    ):
        ai_mark = g.player
        human   = "O" if ai_mark == "X" else "X"
        # bezpečný výběr prvního AI tahu
        r, c = _pick_ai_move_safe(g.board, ai_mark, human, g.size, g.k_to_win, g.difficulty)
        g = apply_move(g, r, c)

    save_game(g)
    return g


# ───────────────────────── game updates ─────────────────────────

def apply_move(g: Game, row: int, col: int) -> Game:
    # (volitelně) jednoduchý guard – pokud bys chtěla tvrdší validaci zde:
    # if g.board[row][col] != ".": raise ValueError("Cell already occupied")

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


# ───────────────────────── AI autoplay (PvE) ─────────────────────────

def _is_ai_turn(g: Game) -> bool:
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
    Dočasně uloží meta-info do g._last_ai, aby ho API mohlo vrátit v odpovědi /play.
    Zaručí bezpečnost tahu (win/block/legality) i v případě zvláštností enginu.
    """
    if not _is_ai_turn(g):
        return g

    diff = _normalize_difficulty(difficulty or getattr(g, "difficulty", "easy") or "easy")

    # kontrola konzistence (odhalí rozhozené start/player/paritu)
    _assert_turn_consistency(g.board, g.player, g.start_mark)

    current_player = g.player
    human_mark = g.human_mark
    ai_mark = "O" if human_mark == "X" else "X"

    # 1) zavoláme engine kvůli statistikám + návrhu tahu
    engine_move: Optional[Tuple[int, int]] = None
    rollouts = 0
    elapsed_ms = 0
    try:
        t0 = time.perf_counter()
        bm = compute_best_move(g.board, ai_mark, g.size, g.k_to_win, difficulty=diff)
        elapsed_ms = int((time.perf_counter() - t0) * 1000)

        if isinstance(bm, dict):
            mv = bm.get("move")
            if isinstance(mv, (list, tuple)) and len(mv) == 2:
                try:
                    engine_move = (int(mv[0]), int(mv[1]))
                except Exception:
                    engine_move = None

            stats = bm.get("stats") or {}
            # robustně vytáhni rollouts (podpora různých klíčů)
            for k in ("rollouts", "n_rollouts", "iterations", "sims"):
                v = stats.get(k)
                if v is not None:
                    try:
                        rollouts = int(v)
                        break
                    except Exception:
                        pass
    except Exception:
        # engine selhal → pád nepropouštíme; jen jedeme bezpečnou větví
        pass

    # 2) bezpečně zvol tah (win/block/legality + mapping),
    #    s preferencí engine_move pokud je k dispozici
    r, c = _pick_ai_move_safe(
        g.board, ai_mark, human_mark, g.size, g.k_to_win, diff,
        precomputed_engine_move=engine_move
    )

    # 3) aplikuj tah a ulož metadata pro odpověď
    try:
        g = apply_move(g, r, c)
        g._last_ai = {
            "move": [r, c],
            "difficulty": diff,
            "rollouts": rollouts,     # ← nyní předáváme skutečné rollouts (pokud je engine dal)
            "elapsedMs": elapsed_ms,  # ← vždy máme čas volání engine (0 pouze při chybě)
            "player": current_player,
            "size": g.size,
            "kToWin": g.k_to_win,
        }
    except Exception:
        # i kdyby selhalo (nemělo by), ulož aspoň stav hry
        pass
    finally:
        save_game(g)

    return g
