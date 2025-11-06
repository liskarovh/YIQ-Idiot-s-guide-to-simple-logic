# tests/react/api/test_limits_and_meta.py
def test_max_board_size_limit_in_new(client):
    # limit N <= 8
    r = client.post("/api/tictactoe/new", json={"size":9, "kToWin":3})
    assert r.status_code == 400
    r = client.post("/api/tictactoe/new", json={"size":8, "kToWin":5})
    assert r.status_code == 200
    game = r.get_json()["game"]
    assert game["size"] == 8 and game["k_to_win"] == 5

def test_max_board_size_limit_in_bestmove_raw(client):
    # raw 9x9 -> 400
    board9 = [["." for _ in range(9)] for __ in range(9)]
    r = client.post("/api/tictactoe/best-move", json={
        "board": board9, "size": 9, "kToWin": 5, "player":"X", "difficulty":"easy"
    })
    assert r.status_code == 400

def test_random_start_and_player_matches(client):
    r = client.post("/api/tictactoe/new", json={
        "size":3, "kToWin":3, "startMark":"Random", "mode":"pve", "humanMark":"X"
    })
    assert r.status_code == 200
    g = r.get_json()["game"]
    assert g["start_mark"] in ("X","O")
    assert g["player"] == g["start_mark"]  # na tahu je ten, kdo byl vylosován

def test_pve_auto_ai_first_move_when_ai_starts(client):
    # Začíná AI (O), human je X → /new už má 1 tah AI na desce
    r = client.post("/api/tictactoe/new", json={
        "size":3, "kToWin":3, "mode":"pve", "startMark":"O", "humanMark":"X",
        "oNickname":"AI-O", "xNickname":"Human-X"
    })
    assert r.status_code == 200
    g = r.get_json()["game"]
    flat = [c for row in g["board"] for c in row]
    assert flat.count("O") == 1
    assert flat.count("X") == 0
    assert g["player"] == "X"          # po AI je na tahu human
    assert len(g["history"]) == 1

def test_hints_used_counter_and_meta_fields(client):
    r = client.post("/api/tictactoe/new", json={"size":3, "kToWin":3})
    gid = r.get_json()["game"]["id"]

    # 2x best-move -> hints_used = 2
    r = client.post("/api/tictactoe/best-move", json={"gameId":gid, "difficulty":"easy"})
    assert r.status_code == 200
    j1 = r.get_json()
    assert "meta" in j1 and "difficulty" in j1["meta"] and "elapsedMs" in j1["meta"]

    r = client.post("/api/tictactoe/best-move", json={"gameId":gid, "difficulty":"easy"})
    assert r.status_code == 200

    r = client.get(f"/api/tictactoe/status/{gid}")
    g = r.get_json()["game"]
    assert g["hints_used"] == 2
    assert g["moves"] == len(g["history"])
    assert g["goal"] == g["k_to_win"]
    assert isinstance(g["timeElapsedMs"], int)

def test_turn_timer_echoed_in_model(client):
    r = client.post("/api/tictactoe/new", json={
        "size":3, "kToWin":3, "turnTimerSec": 90, "mode":"pve", "startMark":"X", "humanMark":"X"
    })
    assert r.status_code == 200
    g = r.get_json()["game"]
    assert g["turnTimerSec"] == 90
