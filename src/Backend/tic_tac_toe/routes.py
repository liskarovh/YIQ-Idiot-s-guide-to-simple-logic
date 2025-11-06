from __future__ import annotations
from flask import Blueprint, request, jsonify

# service import – balíček už máme, stačí relativní
from . import service

bp = Blueprint("react", __name__, url_prefix="/api/tictactoe")


def json_error(code: str, message: str, status: int, meta: dict | None = None):
    payload = {"error": {"code": code, "message": message}}
    if meta is not None:
        payload["error"]["meta"] = meta
    return jsonify(payload), status


@bp.post("/new")
def api_new():
    data = request.get_json(force=True, silent=True) or {}
    try:
        g = service.new_game_from_payload(data)
        return jsonify(service.to_response(g)), 200
    except Exception as e:
        return json_error("bad_request", f"{e}", 400)


@bp.post("/play")
def api_play():
    data = request.get_json(force=True, silent=True) or {}
    gid = data.get("gameId")
    row = data.get("row")
    col = data.get("col")
    if gid is None or row is None or col is None:
        return json_error("bad_request", "Missing gameId/row/col", 400)

    g = service.get_game(gid)
    if not g:
        return json_error("not_found", "Game not found", 404)

    try:
        service.apply_move(g, int(row), int(col))  # lidský tah
        service.maybe_ai_autoplay(g)               # případný AI tah
        return jsonify(service.to_response(g)), 200
    except AssertionError as e:
        return json_error("turn_mismatch", str(e), 409)
    except Exception as e:
        return json_error("invalid_move", f"{e}", 400)


@bp.post("/restart")
def api_restart():
    data = request.get_json(force=True, silent=True) or {}
    gid = data.get("gameId")
    if not gid:
        return json_error("bad_request", "Missing gameId", 400)

    g = service.get_game(gid)
    if not g:
        return json_error("not_found", "Game not found", 404)

    g2 = service.new_game(
        size=g.size,
        k_to_win=g.k_to_win,
        start_mark=g.start_mark,
        human_mark=g.human_mark,
        mode=g.mode,
        turn_timer_s=g.turn_timer_s,
        difficulty=g.difficulty,
        players={"X": {"nickname": g.players["X"].nickname},
                 "O": {"nickname": g.players["O"].nickname}},
        player_name=None,
    )
    return jsonify(service.to_response(g2)), 200


@bp.post("/best-move")
def api_best_move():
    """
    MERGED:
    - zkusí analýzu enginu (pokud je),
    - tah ale vždy určí bezpečný wrapperem (win/block/legální),
    - pokud se liší od enginu, přidá safetyOverride=true.
    """
    data = request.get_json(force=True, silent=True) or {}
    board = data.get("board")
    player = data.get("player")
    size = int(data.get("size", len(board) if board else 3))
    k = int(data.get("kToWin", data.get("k", size)))
    difficulty = data.get("difficulty", "easy")

    if not isinstance(board, list) or player not in ("X", "O"):
        return json_error("bad_request", "Invalid board/player", 400)

    # 1) engine analýza (best-effort)
    engine = {}
    try:
        from .adapter import compute_best_move as _bm
        engine = _bm(board, player, size, k, difficulty=difficulty) or {}
    except Exception as e:
        engine = {"engineError": str(e)}

    # 2) bezpečný tah
    human = "O" if player == "X" else "X"
    r, c = service._pick_ai_move_safe(
        board, ai_mark=player, human_mark=human, size=size, k=k, difficulty=difficulty
    )

    # 3) odpověď (move = bezpečný; analýzu zachováme)
    resp = {
        "move": [int(r), int(c)],
        "meta": {"indexBase": 0, "origin": "top-left", "orientation": "row-major", "validated": True},
    }
    for key in ("analysis", "explain", "explainRich", "stats", "score", "version"):
        if key in engine:
            resp[key] = engine[key]
    if "meta" in engine:
        resp["engineMeta"] = engine["meta"]

    if isinstance(engine.get("move"), (list, tuple)) and engine["move"] != [r, c]:
        resp["safetyOverride"] = True

    return jsonify(resp), 200


@bp.post("/best-move-safe")
def api_best_move_safe():
    """Čistě bezpečná varianta (bez engine analýzy)."""
    data = request.get_json(force=True, silent=True) or {}
    board = data.get("board")
    player = data.get("player")
    size = int(data.get("size", len(board) if board else 3))
    k = int(data.get("kToWin", data.get("k", size)))
    difficulty = data.get("difficulty", "easy")

    if not isinstance(board, list) or player not in ("X", "O"):
        return json_error("bad_request", "Invalid board/player", 400)

    human = "O" if player == "X" else "X"
    r, c = service._pick_ai_move_safe(
        board, ai_mark=player, human_mark=human, size=size, k=k, difficulty=difficulty
    )
    return jsonify({
        "move": [int(r), int(c)],
        "meta": {"indexBase": 0, "origin": "top-left", "orientation": "row-major", "validated": True}
    }), 200
