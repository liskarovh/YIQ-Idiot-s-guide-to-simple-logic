# /tests/tic_tac_toe/api/test_best_move_and_validate.py
import json

def _post_json(client, url, payload):
    return client.post(url, data=json.dumps(payload), content_type="application/json")

def test_best_move_empty_various_difficulties(client):
    board = [[".",".","."],[".",".","."],[".",".","."]]
    for diff in ("easy", "medium", "hard"):
        r = _post_json(client, "/api/tictactoe/best-move", {
            "board": board, "player": "X", "size": 3, "kToWin": 3, "difficulty": diff
        })
        assert r.status_code == 200
        data = r.get_json()
        assert isinstance(data.get("move"), list)
        assert "stats" in data and "elapsedMs" in data["stats"]

def test_best_move_terminal_returns_409(client):
    board = [["X","X","X"],[".",".","."],[".",".","."]]
    r = _post_json(client, "/api/tictactoe/best-move", {
        "board": board, "player": "O", "size": 3, "kToWin": 3, "difficulty": "easy"
    })
    assert r.status_code == 409
    err = r.get_json()["error"]
    assert err["code"] == "GameOver"
    assert err["meta"]["status"] == "win"
    assert err["meta"]["winner"] == "X"

def test_validate_move_basic_true_false(client):
    board = [["X",".","."],[".",".","."],[".",".","."]]
    # obsazené pole → false
    r = _post_json(client, "/api/tictactoe/validate-move", {"board": board, "size": 3, "row": 0, "col": 0})
    assert r.status_code == 200
    assert r.get_json()["ok"] is False
    # volné pole → true
    r = _post_json(client, "/api/tictactoe/validate-move", {"board": board, "size": 3, "row": 1, "col": 2})
    assert r.status_code == 200
    assert r.get_json()["ok"] is True
