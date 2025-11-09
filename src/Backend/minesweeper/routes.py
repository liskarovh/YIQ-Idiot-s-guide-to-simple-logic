from flask import Blueprint, request, Response
import os
import json
import urllib.request
import urllib.error

minesweeper_bp = Blueprint('minesweeper', __name__)

# === Base URL autodetection ===
if "WEBSITE_HOSTNAME" in os.environ:
    NODE_BASE = os.getenv(
            "MINESWEEPER_NODE_URL",
            "https://itu-minesweeper-backend-a0a0a0d4d3b6dmha.westeurope-01.azurewebsites.net"
            )
else:
    NODE_BASE = os.getenv("MINESWEEPER_NODE_URL", "http://127.0.0.1:5051")

print(f"[Minesweeper Proxy] Using Node backend at: {NODE_BASE}")

def _build_url(path: str) -> str:
    """Join NODE_BASE + path (+ query string)."""
    p = path if path.startswith("/") else f"/{path}"
    qs = request.query_string.decode("utf-8") if request.query_string else ""
    return f"{NODE_BASE}{p}" + (f"?{qs}" if qs else "")

def _proxy(method: str, path: str):
    """Generic proxy helper: forwards request from Flask → Node backend."""
    url = _build_url(path)

    # Pass body only for methods that may carry one
    data = None
    if method.upper() in ("POST", "PUT", "PATCH"):
        data = request.get_data() or None

    # Forward important headers (Content-Type, Accept, Idempotency-Key, Authorization)
    headers = {}
    if request.headers.get("Content-Type"):
        headers["Content-Type"] = request.headers["Content-Type"]
    else:
        headers["Content-Type"] = "application/json"
    if request.headers.get("Accept"):
        headers["Accept"] = request.headers["Accept"]
    else:
        headers["Accept"] = "application/json"
    if request.headers.get("Idempotency-Key"):
        headers["Idempotency-Key"] = request.headers["Idempotency-Key"]
    if request.headers.get("Authorization"):
        headers["Authorization"] = request.headers["Authorization"]

    # Optional: basic forwarding context
    if request.remote_addr:
        headers["X-Forwarded-For"] = request.remote_addr

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            payload = resp.read()
            status = resp.getcode()
            ct = resp.headers.get("Content-Type", "application/json")

            # propagate Location (e.g., 201 Created)
            flask_resp = Response(payload, status=status, content_type=ct)
            loc = resp.headers.get("Location")
            if loc:
                flask_resp.headers["Location"] = loc
            return flask_resp

    except urllib.error.HTTPError as e:
        # pass through backend error payload & content-type; also propagate Location if present
        body = e.read()
        ct = (e.headers.get("Content-Type") if e.headers else None) or "application/json"
        flask_resp = Response(body, status=e.code, content_type=ct)
        if e.headers and e.headers.get("Location"):
            flask_resp.headers["Location"] = e.headers.get("Location")
        return flask_resp


# === Routes mapping ===
@minesweeper_bp.route('/capabilities', methods=['GET'])
def capabilities():
    return _proxy('GET', 'capabilities')


@minesweeper_bp.route('/game', methods = ['POST'])
def create_game():
    return _proxy('POST', '/game')


@minesweeper_bp.route('/game/<game_id>', methods = ['GET'])
def get_game(game_id):
    return _proxy('GET', f'/game/{game_id}')


@minesweeper_bp.route('/game/<game_id>/reveal', methods = ['POST'])
def reveal(game_id):
    return _proxy('POST', f'/game/{game_id}/reveal')


@minesweeper_bp.route('/game/<game_id>/flag', methods = ['POST'])
def flag(game_id):
    return _proxy('POST', f'/game/{game_id}/flag')


@minesweeper_bp.route('/game/<game_id>/mode', methods = ['POST'])
def mode(game_id):
    return _proxy('POST', f'/game/{game_id}/mode')


@minesweeper_bp.route('/game/<game_id>/undo', methods = ['POST'])
def undo(game_id):
    return _proxy('POST', f'/game/{game_id}/undo')


@minesweeper_bp.route('/game/<game_id>/seek', methods = ['POST'])
def seek(game_id):
    return _proxy('POST', f'/game/{game_id}/seek')


@minesweeper_bp.route('/game/<game_id>/preview', methods = ['POST'])
def preview(game_id):
    return _proxy('POST', f'/game/{game_id}/preview')


@minesweeper_bp.route('/game/<game_id>/revive', methods = ['POST'])
def revive(game_id):
    return _proxy('POST', f'/game/{game_id}/revive')


@minesweeper_bp.route('/game/<game_id>/hint', methods = ['GET'])
def hint(game_id):
    return _proxy('GET', f'/game/{game_id}/hint')
