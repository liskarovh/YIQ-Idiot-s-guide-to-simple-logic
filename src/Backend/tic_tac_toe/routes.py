# src/Backend/tic_tac_toe/routes.py
from flask import Blueprint, request, jsonify
from . import rules, adapter, service
from .util import json_error
from .config import SIZE_MIN, SIZE_MAX, K_MIN, K_MAX

bp_stateless = Blueprint("tic_tac_toe_stateless", __name__)

def _basic_validate_board(board, size: int) -> bool:
    if not isinstance(board, list) or len(board) != size:
        return False
    allowed = {".", "X", "O"}
    for row in board:
        if not isinstance(row, list) or len(row) != size:
            return False
        for cell in row:
            if cell not in allowed:
                return False
    return True

@bp_stateless.post("/best-move")
def best_move():
    """
    Podporuje dvě formy:
    1) STATEFUL: {gameId, difficulty?, timeCapMs?}
       - načte hru, zvýší hints_used, vrátí tah
    2) STATELESS: {board, player, size, kToWin, difficulty?, timeCapMs?}
    """
    data = request.get_json(force=True) or {}

    # ==== STATEFUL větev ====
    gid = data.get("gameId")
    if gid:
        g = service.get_game(gid)
        if not g:
            return json_error("NotFound", "game not found", 404)

        # Terminál → 409
        term = rules.check_winner(g.board, g.k_to_win)
        if term is not None:
            status = "win" if term in ("X", "O") else "draw"
            meta = {"status": status, "winner": term if status == "win" else None}
            return json_error("GameOver", "Position is terminal; best-move is undefined.", 409, meta=meta)

        difficulty = "hard"
        time_cap = data.get("timeCapMs")

        try:
            result = adapter.compute_best_move(
                g.board, g.player, g.size, g.k_to_win,
                difficulty=difficulty, time_cap_ms=time_cap
            )
        except adapter.EngineTimeout as ex:
            return json_error("EngineTimeout", str(ex), 503)
        except Exception as ex:
            return json_error("Internal", f"best-move failed: {ex}", 500)

        # zvýšit hints_used a uložit
        g.hints_used = int(getattr(g, "hints_used", 0)) + 1
        service.save_game(g)
        return jsonify(result), 200

    # ==== STATELESS větev ====
    board = data.get("board"); player = data.get("player")
    size = data.get("size"); k = data.get("kToWin")
    difficulty = data.get("difficulty", "easy"); time_cap = data.get("timeCapMs")

    if not isinstance(size, int) or not isinstance(k, int) or size < SIZE_MIN or size > SIZE_MAX:
        return json_error("InvalidInput", "Invalid size range", 400)
    if k < K_MIN or k > min(K_MAX, size):
        return json_error("InvalidInput", "Invalid kToWin range", 400)
    if player not in ("X", "O"):
        return json_error("InvalidInput", "player must be 'X' or 'O'", 400)
    if not _basic_validate_board(board, size):
        return json_error("InvalidInput", "board does not match size or contains invalid symbols", 400)

    term = rules.check_winner(board, k)
    if term is not None:
        status = "win" if term in ("X", "O") else "draw"
        meta = {"status": status, "winner": term if status == "win" else None}
        return json_error("GameOver", "Position is terminal; best-move is undefined.", 409, meta=meta)

    try:
        result = adapter.compute_best_move(board, player, size, k, difficulty=difficulty, time_cap_ms=time_cap)
        return jsonify(result), 200
    except adapter.EngineTimeout as ex:
        return json_error("EngineTimeout", str(ex), 503)
    except Exception as ex:
        return json_error("Internal", f"best-move failed: {ex}", 500)

@bp_stateless.post("/validate-move")
def validate_move():
    data = request.get_json(force=True) or {}
    board = data.get("board"); size = data.get("size")
    row = data.get("row"); col = data.get("col")

    if not isinstance(size, int) or size < SIZE_MIN or size > SIZE_MAX:
        return json_error("InvalidInput", "Invalid size", 400)
    if not _basic_validate_board(board, size):
        return json_error("InvalidInput", "board does not match size or contains invalid symbols", 400)

    try:
        row = int(row); col = int(col)
    except Exception:
        return json_error("InvalidInput", "row and col must be integers", 400)
    if row < 0 or row >= size or col < 0 or col >= size:
        return json_error("InvalidInput", "row/col out of bounds", 400)

    ok = rules.is_legal_move(board, row, col)
    return jsonify({"ok": ok}), 200

# Alias pro kompatibilitu s app.py
tic_tac_toe_bp = bp_stateless
