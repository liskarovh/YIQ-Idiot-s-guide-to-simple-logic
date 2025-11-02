from flask import Blueprint, request, Response
import os
import json
import urllib.request
import urllib.error

minesweeper_bp = Blueprint('minesweeper', __name__)

NODE_BASE = os.getenv("MINESWEEPER_NODE_URL", "http://127.0.0.1:5051")


def _proxy(method: str, path: str):
    url = f"{NODE_BASE}{path}"
    data = None
    headers = {"Content-Type": "application/json"}

    if request.data:
        data = request.data

    req = urllib.request.Request(url, data = data, headers = headers, method = method)
    try:
        with urllib.request.urlopen(req, timeout = 10) as resp:
            payload = resp.read()
            status = resp.getcode()
            ct = resp.headers.get("Content-Type", "application/json")
            return Response(payload, status = status, content_type = ct)
    except urllib.error.HTTPError as e:
        return Response(e.read(), status = e.code, content_type = e.headers.get("Content-Type", "application/json"))
    except Exception as e:
        body = json.dumps({"error": f"proxy_error: {str(e)}"}).encode("utf-8")
        return Response(body, status = 502, content_type = "application/json")

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


@minesweeper_bp.route('/game/<game_id>/revive', methods = ['POST'])
def revive(game_id):
    return _proxy('POST', f'/game/{game_id}/revive')


@minesweeper_bp.route('/game/<game_id>/hint', methods = ['GET'])
def hint(game_id):
    return _proxy('GET', f'/game/{game_id}/hint')
