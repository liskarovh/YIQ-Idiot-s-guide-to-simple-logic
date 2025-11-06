# /tests/react/api/test_conflicts_and_restart.py
import json

def _post_json(client, url, payload):
    return client.post(url, data=json.dumps(payload), content_type="application/json")

def test_play_409_after_game_end(client):
    r = _post_json(client, "/api/tictactoe/new", {"size": 3, "kToWin": 3, "startMark": "X", "mode": "PvP"})
    assert r.status_code == 200
    gid = r.get_json()["game"]["id"]

    # X vyhraje řadou 0
    _post_json(client, "/api/tictactoe/play", {"gameId": gid, "row": 0, "col": 0})
    _post_json(client, "/api/tictactoe/play", {"gameId": gid, "row": 1, "col": 0})
    _post_json(client, "/api/tictactoe/play", {"gameId": gid, "row": 0, "col": 1})
    _post_json(client, "/api/tictactoe/play", {"gameId": gid, "row": 1, "col": 1})
    r = _post_json(client, "/api/tictactoe/play", {"gameId": gid, "row": 0, "col": 2})
    assert r.status_code == 200
    assert r.get_json()["game"]["status"] == "win"

    # další tah už musí vrátit 409
    r = _post_json(client, "/api/tictactoe/play", {"gameId": gid, "row": 2, "col": 2})
    assert r.status_code == 409
    assert r.get_json()["error"]["code"] == "GameOver"

def test_restart_preserves_settings_and_new_id(client):
    r = _post_json(client, "/api/tictactoe/new", {
        "size": 5, "kToWin": 4, "startMark": "Random", "mode": "PvE",
        "humanMark": "X", "difficulty": "hard", "turnTimerSec": 30
    })
    assert r.status_code == 200
    g = r.get_json()["game"]
    gid = g["id"]

    r = _post_json(client, "/api/tictactoe/restart", {"gameId": gid})
    assert r.status_code == 200
    g2 = r.get_json()["game"]

    assert g2["id"] != gid
    assert g2["size"] == g["size"]
    assert g2["k_to_win"] == g["k_to_win"]
    assert g2["mode"] == g["mode"]
    assert g2["difficulty"] == g["difficulty"]
