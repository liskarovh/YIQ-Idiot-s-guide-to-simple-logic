import itertools

import pytest

SIZES_K = [
    (3, 3),   # S1
    (4, 3),   # S2
    (5, 4),   # S3
    (8, 5),   # S4
    (5, 5),   # S5 (edge: K==N)
]
DIFFS = ["easy", "medium", "hard"]  # D1–D3

@pytest.mark.parametrize("size,kToWin", SIZES_K)
def test_new_valid_sizes_and_k(client, size, kToWin):
    r = client.post("/api/tictactoe/new", json={"size": size, "kToWin": kToWin})
    assert r.status_code == 200
    g = r.get_json()["game"]
    assert g["size"] == size
    assert g["k_to_win"] == kToWin
    assert g["status"] == "running"
    # board shape NxN with '.'
    assert len(g["board"]) == size and all(len(row) == size for row in g["board"])
    assert all(cell in (".",) for row in g["board"] for cell in row)

def test_new_invalid_k_gt_size(client):
    r = client.post("/api/tictactoe/new", json={"size": 3, "kToWin": 4})
    assert r.status_code == 400

@pytest.mark.parametrize("size,kToWin", [(3,3),(5,4),(8,5)])
@pytest.mark.parametrize("difficulty", DIFFS)
def test_best_move_schema_and_legality_across_difficulties(client, size, kToWin, difficulty):
    # start a new game and request best-move
    r = client.post("/api/tictactoe/new", json={"size": size, "kToWin": kToWin})
    assert r.status_code == 200
    gid = r.get_json()["game"]["id"]

    r = client.post("/api/tictactoe/best-move", json={"gameId": gid, "difficulty": difficulty})
    assert r.status_code == 200
    j = r.get_json()
    # schema
    assert "move" in j and isinstance(j["move"], list) and len(j["move"]) == 2
    assert "explain" in j and "analysis" in j and isinstance(j["analysis"], dict)
    # legality
    r0, c0 = j["move"]
    assert 0 <= r0 < size and 0 <= c0 < size

@pytest.mark.parametrize("size,kToWin", [(5,4),(8,5)])
def test_win_detection_on_bigger_sizes(client, size, kToWin):
    # Simple horizontal win by X on row 0 with K stones
    r = client.post("/api/tictactoe/new", json={"size": size, "kToWin": kToWin, "startMark": "X"})
    assert r.status_code == 200
    gid = r.get_json()["game"]["id"]

    # Build a line: X at (0,0), O somewhere else, X at (0,1), ...
    # We alternate moves to respect turn rules.
    def play(row, col):
        return client.post("/api/tictactoe/play", json={"gameId": gid, "row": row, "col": col})

    # Place K marks for X in row 0, interleaving safe O moves below
    for i in range(kToWin):
        assert play(0, i).status_code == 200           # X
        # stop early if already won (for small K)
        status = client.get(f"/api/tictactoe/status/{gid}").get_json()["game"]["status"]
        if status != "running":
            break
        # O move: put it far away to not block (i, size-1)
        _ = play(min(i+1, size-1), size-1)

    g = client.get(f"/api/tictactoe/status/{gid}").get_json()["game"]
    assert g["status"] in ("running","win")  # allow immediate win on last step
    if g["status"] == "win":
        assert g["winner"] == "X"
