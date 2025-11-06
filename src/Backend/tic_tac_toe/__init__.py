from __future__ import annotations
from flask import Blueprint, request, jsonify, send_from_directory
import logging
import time
import os

from . import rules
from . import service as svc
from .adapter import compute_best_move
from .explain import build_explanation  # ← zůstává

bp = Blueprint("react", __name__, url_prefix="/api/tictactoe")
log = logging.getLogger(__name__)

SIZE_MIN, SIZE_MAX = 3, 8
K_MIN, K_MAX = 3, 5


def json_error(code: str, message: str, status: int, meta: dict | None = None):
    payload = {"error": {"code": code, "message": message}}
    if meta is not None:
        payload["error"]["meta"] = meta
    return jsonify(payload), status


def _norm_difficulty(d: str | None) -> str:
    d2 = (d or "easy").strip().lower()
    return d2 if d2 in ("easy", "medium", "hard") else "easy"


def _mk_analysis(player: str, size: int, k: int, difficulty: str, explain: str | None = None) -> dict:
    a = {"player": player, "size": size, "kToWin": k, "difficulty": difficulty}
    if explain is not None:
        a["explain"] = explain
    return a


def _mk_explain(bm_stats: dict, player: str, size: int, k: int, difficulty: str) -> str:
    rolls = 0
    if isinstance(bm_stats, dict):
        rolls = int(bm_stats.get("rollouts", 0) or 0)
    return f"MCTS rollouts={rolls}; size={size}; k={k}; player={player}; difficulty={difficulty}"


@bp.get("/meta")
def api_meta():
    return jsonify({
        "size": {"min": SIZE_MIN, "max": SIZE_MAX},
        "kToWin": {"min": K_MIN, "max": K_MAX},
        "difficulties": ["easy", "medium", "hard"],
        "modes": ["pve", "pvp"],
    }), 200


@bp.post("/new")
def api_new():
    data = request.get_json(silent=True) or {}
    log.debug("api_new payload: %s", data)

    try:
        size = int(data.get("size", 3))
        k = int(data.get("kToWin", 3))
    except Exception:
        return json_error("InvalidInput", "size/kToWin must be integers", 400)

    if not (SIZE_MIN <= size <= SIZE_MAX):
        return json_error("InvalidInput", f"size must be between {SIZE_MIN} and {SIZE_MAX}", 400)
    if not (K_MIN <= k <= K_MAX) or k > size:
        return json_error("InvalidInput", "kToWin out of range or larger than size", 400)

    try:
        g = svc.new_game_from_payload(data)
        return jsonify(svc.to_response(g)), 200
    except Exception as e:
        log.exception("Unhandled exception on POST /api/tictactoe/new")
        return json_error("Internal", str(e), 500)


@bp.get("/status/<game_id>")
def api_status(game_id: str):
    g = svc.get_game(game_id)
    if not g:
        return json_error("NotFound", "Game not found", 404)
    return jsonify(svc.to_response(g)), 200


@bp.get("/state")
def api_state():
    game_id = request.args.get("gameId")
    if not game_id:
        return json_error("BadRequest", "gameId required", 400)
    g = svc.get_game(game_id)
    if not g:
        return json_error("NotFound", "Game not found", 404)
    return jsonify(svc.to_response(g)), 200


@bp.post("/play")
def api_play():
    data = request.get_json(silent=True) or {}
    gid = data.get("gameId")
    row = data.get("row")
    col = data.get("col")

    if not isinstance(gid, str):
        return json_error("BadRequest", "gameId required", 400)
    if not (isinstance(row, int) and isinstance(col, int)):
        return json_error("BadRequest", "row/col required", 400)

    g = svc.get_game(gid)
    if not g:
        return json_error("NotFound", "Game not found", 404)

    if g.status != "running":
        return json_error("GameOver", "Game already finished", 409)

    if not (0 <= row < g.size and 0 <= col < g.size):
        return json_error("InvalidMove", "Out of range", 400)
    if g.board[row][col] != ".":
        return json_error("InvalidMove", "Cell occupied", 400)

    try:
        g = svc.apply_move(g, row, col)
    except Exception as e:
        log.exception("apply_move failed")
        return json_error("Internal", str(e), 500)

    if g.mode == "pve":
        g = svc.maybe_ai_autoplay(g, difficulty=g.difficulty)

    return jsonify(svc.to_response(g)), 200


@bp.post("/best-move")
def api_best_move():
    """
    MERGED varianta:
    - stateful poradna: vždy počítá HARD, vrací bezpečný tah (win/block/legální),
      přidá safetyOverride=true, když engine navrhl něco jiného.
    - stateless kalkul: stejné chování, ale s payload board/size/k/player/difficulty.
    """
    data = request.get_json(silent=True) or {}

    # === stateful poradna (gameId) ===
    gid = data.get("gameId")
    if isinstance(gid, str):
        g = svc.get_game(gid)
        if not g:
            return json_error("NotFound", "Game not found", 404)
        if g.status != "running":
            return json_error("GameOver", "Game is terminal", 409)

        diff = "hard"  # poradna = vždy nejlepší výpočet
        t0 = time.perf_counter()
        engine = {}
        try:
            engine = compute_best_move(g.board, g.player, g.size, g.k_to_win, difficulty=diff) or {}
        except Exception as e:
            engine = {"engineError": str(e)}
        elapsed_ms = int((time.perf_counter() - t0) * 1000)

        # bezpečný tah
        human = "O" if g.player == "X" else "X"
        r, c = svc._pick_ai_move_safe(g.board, ai_mark=g.player, human_mark=human,
                                      size=g.size, k=g.k_to_win, difficulty=diff)
        safe_move = [int(r), int(c)]
        engine_move = engine.get("move") if isinstance(engine.get("move"), (list, tuple)) else None
        safety_override = (engine_move is None) or (engine_move != safe_move)

        stats = (engine.get("stats") or {}).copy() if isinstance(engine.get("stats"), dict) else {}
        stats.setdefault("elapsedMs", elapsed_ms)
        explain = _mk_explain(stats, g.player, g.size, g.k_to_win, diff)
        analysis = _mk_analysis(g.player, g.size, g.k_to_win, diff, explain=explain)
        rich = build_explanation(g.board, safe_move, g.player, g.size, g.k_to_win)

        # inkrementace hintů
        try:
            g.hints_used = int(getattr(g, "hints_used", 0)) + 1
        except Exception:
            pass
        svc.save_game(g)

        resp = {
            "move": safe_move,
            "score": engine.get("score", 0.0),
            "stats": stats,
            "version": engine.get("version", "py-omega-1.2.0"),
            "analysis": analysis,
            "explain": explain,
            "explainRich": rich,
            "meta": {"difficulty": diff, "elapsedMs": elapsed_ms},
        }
        if safety_override:
            resp["safetyOverride"] = True
        if "meta" in engine:
            resp["engineMeta"] = engine["meta"]
        return jsonify(resp), 200

    # === stateless kalkul ===
    board = data.get("board")
    size = int(data.get("size", 0) or 0)
    k = int(data.get("kToWin", 0) or 0)
    player = (data.get("player") or "X").strip().upper()
    diff = _norm_difficulty(data.get("difficulty"))

    if not (SIZE_MIN <= size <= SIZE_MAX):
        return json_error("InvalidInput", f"size must be between {SIZE_MIN} and {SIZE_MAX}", 400)
    if not (K_MIN <= k <= K_MAX) or k > size:
        return json_error("InvalidInput", "kToWin out of range or larger than size", 400)
    if player not in ("X", "O"):
        return json_error("InvalidInput", "player must be X or O", 400)
    if not isinstance(board, list) or len(board) != size or any(len(r) != size for r in board):
        return json_error("InvalidInput", "board shape mismatch", 400)

    term = rules.check_winner(board, k)
    if term is not None:
        status = "win" if term in ("X", "O") else "draw"
        meta = {"status": status}
        if status == "win":
            meta["winner"] = term
        return json_error("GameOver", "Position is terminal", 409, meta=meta)

    t0 = time.perf_counter()
    engine = {}
    try:
        engine = compute_best_move(board, player, size, k, difficulty=diff) or {}
    except Exception as e:
        engine = {"engineError": str(e)}
    elapsed_ms = int((time.perf_counter() - t0) * 1000)

    # bezpečný tah
    human = "O" if player == "X" else "X"
    r, c = svc._pick_ai_move_safe(board, ai_mark=player, human_mark=human,
                                  size=size, k=k, difficulty=diff)
    safe_move = [int(r), int(c)]
    engine_move = engine.get("move") if isinstance(engine.get("move"), (list, tuple)) else None
    safety_override = (engine_move is None) or (engine_move != safe_move)

    stats = (engine.get("stats") or {}).copy() if isinstance(engine.get("stats"), dict) else {}
    stats.setdefault("elapsedMs", elapsed_ms)
    explain = _mk_explain(stats, player, size, k, diff)
    analysis = _mk_analysis(player, size, k, diff, explain=explain)
    rich = build_explanation(board, safe_move, player, size, k)

    resp = {
        "move": safe_move,
        "score": engine.get("score", 0.0),
        "stats": stats,
        "version": engine.get("version", "py-omega-1.2.0"),
        "analysis": analysis,
        "explain": explain,
        "explainRich": rich,
        "meta": {"difficulty": diff, "elapsedMs": elapsed_ms},
    }
    if safety_override:
        resp["safetyOverride"] = True
    if "meta" in engine:
        resp["engineMeta"] = engine["meta"]

    return jsonify(resp), 200


@bp.post("/best-move-safe")
def api_best_move_safe():
    """Čistě bezpečný výpočet bez engine analýzy (rychlé smoke testy / A/B)."""
    data = request.get_json(silent=True) or {}
    board = data.get("board")
    size = int(data.get("size", 0) or 0)
    k = int(data.get("kToWin", 0) or 0)
    player = (data.get("player") or "X").strip().upper()
    diff = _norm_difficulty(data.get("difficulty"))

    if not (SIZE_MIN <= size <= SIZE_MAX):
        return json_error("InvalidInput", f"size must be between {SIZE_MIN} and {SIZE_MAX}", 400)
    if not (K_MIN <= k <= K_MAX) or k > size:
        return json_error("InvalidInput", "kToWin out of range or larger than size", 400)
    if player not in ("X", "O"):
        return json_error("InvalidInput", "player must be X or O", 400)
    if not isinstance(board, list) or len(board) != size or any(len(r) != size for r in board):
        return json_error("InvalidInput", "board shape mismatch", 400)

    term = rules.check_winner(board, k)
    if term is not None:
        status = "win" if term in ("X", "O") else "draw"
        meta = {"status": status}
        if status == "win":
            meta["winner"] = term
        return json_error("GameOver", "Position is terminal", 409, meta=meta)

    human = "O" if player == "X" else "X"
    r, c = svc._pick_ai_move_safe(board, ai_mark=player, human_mark=human,
                                  size=size, k=k, difficulty=diff)
    return jsonify({
        "move": [int(r), int(c)],
        "meta": {"indexBase": 0, "origin": "top-left", "orientation": "row-major", "validated": True}
    }), 200


@bp.post("/validate-move")
def api_validate_move():
    data = request.get_json(silent=True) or {}
    board = data.get("board")
    size = int(data.get("size", 0) or 0)
    row = data.get("row")
    col = data.get("col")

    if not (isinstance(board, list) and size >= 1 and isinstance(row, int) and isinstance(col, int)):
        return json_error("InvalidInput", "Malformed request", 400)
    if len(board) != size or any(len(r) != size for r in board):
        return json_error("InvalidInput", "board shape mismatch", 400)

    valid = (0 <= row < size and 0 <= col < size and board[row][col] == ".")
    return jsonify({"ok": bool(valid), "valid": bool(valid)}), 200


@bp.post("/restart")
def api_restart():
    data = request.get_json(silent=True) or {}
    gid = data.get("gameId")
    if not isinstance(gid, str):
        return json_error("BadRequest", "gameId required", 400)

    old = svc.get_game(gid)
    if not old:
        return json_error("NotFound", "Game not found", 404)

    old_px = getattr(old.players.get("X"), "nickname", None) if old.players else None
    old_po = getattr(old.players.get("O"), "nickname", None) if old.players else None
    players_payload = {
        "X": {"nickname": old_px} if old_px else {},
        "O": {"nickname": old_po} if old_po else {},
    }

    try:
        g = svc.new_game(
            size=old.size,
            k_to_win=old.k_to_win,
            start_mark=old.start_mark,
            human_mark=old.human_mark,
            mode=old.mode,
            turn_timer_s=old.turn_timer_s,
            difficulty=getattr(old, "difficulty", "easy"),
            players=players_payload,
        )
        return jsonify(svc.to_response(g)), 200
    except Exception as e:
        log.exception("Unhandled exception on POST /api/tictactoe/restart")
        return json_error("Internal", str(e), 500)


@bp.get("/static/<path:filename>")
def ttt_static(filename: str):
    base = os.path.join(os.path.dirname(__file__))
    return send_from_directory(base, filename)
