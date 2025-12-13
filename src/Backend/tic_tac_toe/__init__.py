from __future__ import annotations
from flask import Blueprint, request, jsonify, send_from_directory, Response, stream_with_context
import logging
import time
import os
import json
import threading
import queue

from . import rules
from . import service as svc
from .adapter import compute_best_move
from .explain import build_explanation

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


# ───────────────────────── Spectator driver (AI vs AI) ─────────────────────────

class _SpectatorGame:
    __slots__ = ("game_id", "thread", "stop", "subs", "lock", "delay_ms", "difficulty")

    def __init__(self, game_id: str, delay_ms: int, difficulty: str):
        self.game_id = game_id
        self.stop = threading.Event()
        self.thread: threading.Thread | None = None
        self.subs: set[queue.Queue] = set()
        self.lock = threading.Lock()
        self.delay_ms = int(max(0, delay_ms))
        self.difficulty = difficulty


_SPECTATOR_REG: dict[str, _SpectatorGame] = {}
_SPECTATOR_REG_LOCK = threading.Lock()


def _notify(game_id: str, event_type: str, data: dict):
    with _SPECTATOR_REG_LOCK:
        sg = _SPECTATOR_REG.get(game_id)
        if not sg:
            log.debug("SSE notify dropped: game %s not registered", game_id)
            return
        targets = list(sg.subs)

    payload = {"type": event_type, "data": data}

    log.info(
        "SSE notify → game=%s type=%s subs=%d payload=%s",
        game_id, event_type, len(targets), data,
    )

    for q in targets:
        try:
            q.put_nowait(payload)
        except Exception:
            log.exception("SSE notify: failed to enqueue for game %s", game_id)
            # drop silently
            pass


def _start_driver(game_id: str, delay_ms: int, difficulty: str):
    sg = _SpectatorGame(game_id, delay_ms, difficulty)
    with _SPECTATOR_REG_LOCK:
        _SPECTATOR_REG[game_id] = sg

    def _run():
        try:
            while not sg.stop.is_set():
                g = svc.get_game(game_id)
                if not g:
                    break
                term = rules.check_winner(g.board, g.k_to_win)
                if term is not None or getattr(g, "status", "running") != "running":
                    status = "win" if term in ("X", "O") else ("draw" if term == "draw" else getattr(g, "status", "running"))

                    try:
                        g.status = status
                        if status == "win":
                            setattr(g, "winner", term)
                        svc.save_game(g)
                    except Exception:
                        log.exception("Failed to persist spectator end-state for game %s", game_id)

                    end_payload = {
                        "status": status,
                        "winner": term if status == "win" else None,
                        "winningSequence": svc._winning_sequence_for(g),
                    }
                    _notify(game_id, "end", end_payload)
                    break

                # compute move for current player (AI vs AI)
                ai_mark = g.player
                human_mark = "O" if ai_mark == "X" else "X"
                try:
                    r, c = svc._pick_ai_move_safe(  # type: ignore[attr-defined]
                        g.board, ai_mark, human_mark, g.size, g.k_to_win, sg.difficulty
                    )
                except Exception:
                    # fallback: pick first legal
                    found = False
                    for rr in range(g.size):
                        for cc in range(g.size):
                            if g.board[rr][cc] == ".":
                                r, c = rr, cc
                                found = True
                                break
                        if found: break
                    if not found:
                        # no legal move → draw
                        g.status = "draw"
                        svc.save_game(g)
                        continue

                try:
                    rich = build_explanation(
                        g.board,
                        (int(r), int(c)),
                        ai_mark,
                        g.size,
                        g.k_to_win,
                    )
                except Exception:
                    rich = {
                        "summary": "",
                        "reasons": [],
                        "winningSequence": [],
                        "hints": {},
                    }

                try:
                    g2 = svc.apply_move(g, int(r), int(c))
                except Exception:
                    break

                move_payload = {
                    "player": ai_mark,
                    "row": int(r),
                    "col": int(c),
                    "board": g2.board,
                    "moves": len(g2.history),
                    "explain": rich.get("summary"),
                    "explainRich": rich,
                    "stats": {
                        "origin": "spectator",
                        **(rich.get("hints") or {}),
                    },
                }
                _notify(game_id, "move", move_payload)

                # small sleep between moves
                delay = max(0, int(sg.delay_ms))
                time.sleep(delay / 1000.0 if delay > 0 else 0)

            # ensure end event once when loop exits due to status
            g = svc.get_game(game_id)
            if g:
                term = rules.check_winner(g.board, g.k_to_win)
                if term is not None or getattr(g, "status", "running") != "running":
                    status = "win" if term in ("X", "O") else (
                        "draw" if term == "draw" else getattr(g, "status", "running")
                    )

                    try:
                        g.status = status
                        if status == "win":
                            setattr(g, "winner", term)
                        svc.save_game(g)
                    except Exception:
                        log.exception(
                            "Failed to persist spectator end-state (post-loop) for game %s",
                            game_id,
                        )

                    end_payload = {
                        "status": status,
                        "winner": term if status == "win" else None,
                        "winningSequence": svc._winning_sequence_for(g),  # type: ignore[attr-defined]
                    }
                    _notify(game_id, "end", end_payload)
        finally:
            # cleanup registry entry
            with _SPECTATOR_REG_LOCK:
                _SPECTATOR_REG.pop(game_id, None)

    t = threading.Thread(target=_run, name=f"ttt-spectator-{game_id}", daemon=True)
    sg.thread = t
    t.start()
    return sg


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
    data = request.get_json(silent=True) or {}

    # === stateful poradna (gameId) ===
    gid = data.get("gameId")
    if isinstance(gid, str):
        g = svc.get_game(gid)
        if not g:
            return json_error("NotFound", "Game not found", 404)
        if g.status != "running":
            return json_error("GameOver", "Game is terminal", 409)

        diff = "hard"
        t0 = time.perf_counter()
        engine = {}
        try:
            engine = compute_best_move(g.board, g.player, g.size, g.k_to_win, difficulty=diff) or {}
        except Exception as e:
            engine = {"engineError": str(e)}
        elapsed_ms = int((time.perf_counter() - t0) * 1000)

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


@bp.post("/timeout-lose")
def api_timeout_lose():
    data = request.get_json(silent=True) or {}
    gid = data.get("gameId")

    if not isinstance(gid, str):
        return json_error("BadRequest", "gameId required", 400)

    g = svc.get_game(gid)
    if not g:
        return json_error("NotFound", "Game not found", 404)

    if getattr(g, "status", "running") != "running":
        return json_error("GameOver", "Game already finished", 409)

    cur = (getattr(g, "player", "X") or "X").strip().upper()
    if cur not in ("X", "O"):
        cur = "X"
    winner = "O" if cur == "X" else "X"

    g.status = "timeout"
    setattr(g, "winner", winner)

    try:
        svc.save_game(g)
    except Exception as e:
        log.exception("Failed to persist timeout-lose for game %s", gid)
        return json_error("Internal", str(e), 500)

    return jsonify(svc.to_response(g)), 200


@bp.get("/static/<path:filename>")
def ttt_static(filename: str):
    base = os.path.join(os.path.dirname(__file__))
    return send_from_directory(base, filename)


# ───────────────────────── Spectator API ─────────────────────────

@bp.post("/spectator/new")
def api_spectator_new():
    data = request.get_json(silent=True) or {}
    try:
        size = int(data.get("size", 3))
        k = int(data.get("kToWin", 3))
    except Exception:
        return json_error("InvalidInput", "size/kToWin must be integers", 400)

    if not (SIZE_MIN <= size <= SIZE_MAX):
        return json_error("InvalidInput", f"size must be between {SIZE_MIN} and {SIZE_MAX}", 400)
    if not (K_MIN <= k <= K_MAX) or k > size:
        return json_error("InvalidInput", "kToWin out of range or larger than size", 400)

    difficulty = _norm_difficulty(data.get("difficulty"))

    # Delay (default 2 s)
    md = data.get("moveDelayMs")
    if md is None:
        delay_ms = 2000  # 3 sekund
    else:
        try:
            delay_ms = max(0, int(md))
        except Exception:
            delay_ms = 2000
    # Create AI vs AI game
    try:
        g = svc.new_game(
            size=size,
            k_to_win=k,
            start_mark=data.get("startMark") or "X",
            mode="pvp",
            difficulty=difficulty,
            players={
                "X": {"nickname": "Alpha", "kind": "ai"},
                "O": {"nickname": "Beta",  "kind": "ai"},
            },
        )
    except Exception as e:
        log.exception("Failed to create spectator game")
        return json_error("Internal", str(e), 500)

    _start_driver(g.id, delay_ms=delay_ms, difficulty=difficulty)

    return jsonify({
        "gameId": g.id,
        "state": svc.to_response(g),
    }), 200


@bp.get("/spectator/state")
def api_spectator_state():
    game_id = request.args.get("gameId")
    if not game_id:
        return json_error("BadRequest", "gameId required", 400)
    g = svc.get_game(game_id)
    if not g:
        return json_error("NotFound", "Game not found", 404)
    return jsonify(svc.to_response(g)), 200


@bp.get("/spectator/events")
def api_spectator_events():
    game_id = request.args.get("gameId")
    if not game_id:
        return json_error("BadRequest", "gameId required", 400)
    g = svc.get_game(game_id)
    if not g:
        return json_error("NotFound", "Game not found", 404)

    # ensure driver exists (could be re-attached)
    with _SPECTATOR_REG_LOCK:
        if game_id not in _SPECTATOR_REG:
            # start a gentle driver with default parameters if missing
            _start_driver(game_id, delay_ms=2000, difficulty=getattr(g, "difficulty", "easy") or "easy")

    client_q: queue.Queue = queue.Queue(maxsize=128)
    with _SPECTATOR_REG_LOCK:
        sg = _SPECTATOR_REG.get(game_id)
        if sg:
            sg.subs.add(client_q)

    def _format_event(event: str, data_obj: dict) -> str:
        return f"event: {event}\n" + "data: " + json.dumps(data_obj, ensure_ascii=False) + "\n\n"

    @stream_with_context
    def _stream():
        try:
            # initial full snapshot
            yield _format_event("state", svc.to_response(g))
            last_ping = time.time()
            while True:
                try:
                    item = client_q.get(timeout=15.0)
                    if not isinstance(item, dict):
                        continue
                    t = item.get("type")
                    d = item.get("data")
                    if t == "move":
                        yield _format_event("move", d)
                    elif t == "end":
                        yield _format_event("end", d)
                        break
                    elif t == "state":
                        yield _format_event("state", d)
                except queue.Empty:
                    # heartbeat
                    yield ": ping\n\n"
                    # also re-ping every ~15s
                    now = time.time()
                    if now - last_ping > 30:
                        last_ping = now
                        # recheck game status and send state if ended silently
                        gg = svc.get_game(game_id)
                        if not gg:
                            yield _format_event("end", {"status": "timeout"})
                            break
        finally:
            # cleanup subscriber
            with _SPECTATOR_REG_LOCK:
                sg2 = _SPECTATOR_REG.get(game_id)
                if sg2 and client_q in sg2.subs:
                    sg2.subs.discard(client_q)

    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        # CORS is managed globally by app CORS config
    }
    return Response(_stream(), status=200, headers=headers)
