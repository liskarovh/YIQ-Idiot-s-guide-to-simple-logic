import json

def _post_json(client, url, payload):
    return client.post(url, data=json.dumps(payload), content_type="application/json")

def test_api_top_level_winning_sequence(client):
    r = _post_json(client, "/api/tictactoe/new",
                   {"size": 5, "kToWin": 5, "mode": "pvp", "startMark": "X"})
    assert r.status_code == 200
    gid = r.get_json()["game"]["id"]

    def play(rw, cl):
        return _post_json(client, "/api/tictactoe/play", {"gameId": gid, "row": rw, "col": cl})

    # X vyhraje diagonálu, O hraje do první řady
    play(0,0); play(0,1)
    play(1,1); play(0,2)
    play(2,2); play(0,3)
    play(3,3); play(0,4)
    rr = play(4,4)

    js = rr.get_json()
    assert js["status"] == "win"
    assert js["winner"] == "X"
    assert js["winningSequence"] == [
        {"row":0,"col":0},
        {"row":1,"col":1},
        {"row":2,"col":2},
        {"row":3,"col":3},
        {"row":4,"col":4},
    ]
    # a je to i uvnitř game
    assert js["game"]["winningSequence"] == js["winningSequence"]

    # /state vrací totéž
    s = client.get(f"/api/tictactoe/state?gameId={gid}")
    js2 = s.get_json()
    assert js2["status"] == "win"
    assert js2["winner"] == "X"
    assert js2["winningSequence"] == js["winningSequence"]
