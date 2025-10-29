# tests/tic_tac_toe/api/test_flow.py
def test_api_flow_new_play_status_bestmove(client):
    # NEW
    r = client.post("/api/tictactoe/new", json={"size":3, "kToWin":3})
    assert r.status_code == 200
    game = r.get_json()["game"]
    gid = game["id"]
    assert game["size"] == 3 and game["k_to_win"] == 3
    assert game["status"] == "running"
    assert game["board"] == [[".",".","."],[".",".","."],[".",".","."]]
    assert game["snapshots"][0]["ply"] == 0

    # PLAY (X 0,0)
    r = client.post("/api/tictactoe/play", json={"gameId":gid,"row":0,"col":0})
    assert r.status_code == 200
    game = r.get_json()["game"]
    assert game["board"][0][0] == "X"
    assert game["player"] == "O"   # přepnulo se kdo je na tahu
    assert len(game["history"]) == 1
    assert game["snapshots"][-1]["ply"] == 1

    # STATUS
    r = client.get(f"/api/tictactoe/status/{gid}")
    assert r.status_code == 200
    game = r.get_json()["game"]
    assert game["id"] == gid

    # BEST-MOVE (přes gameId)
    r = client.post("/api/tictactoe/best-move", json={"gameId":gid, "difficulty":"easy"})
    assert r.status_code == 200
    j = r.get_json()
    assert "move" in j and isinstance(j["move"], list) and len(j["move"]) == 2
    r0, c0 = j["move"]
    assert 0 <= r0 < 3 and 0 <= c0 < 3
    assert "analysis" in j and "explain" in j["analysis"]

def test_api_errors(client):
    # nevalidní kToWin
    r = client.post("/api/tictactoe/new", json={"size":3, "kToWin":9})
    assert r.status_code == 400
    # play bez gameId
    r = client.post("/api/tictactoe/play", json={"row":0,"col":0})
    assert r.status_code == 400
    # status na neexistující id
    r = client.get("/api/tictactoe/status/does-not-exist")
    assert r.status_code == 404
