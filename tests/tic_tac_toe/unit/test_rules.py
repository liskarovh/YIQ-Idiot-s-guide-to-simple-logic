
# src/Backend/tests/unit/test_rules.py
import pytest
from tic_tac_toe import service
from tic_tac_toe.models import Move

def test_win_row():
    g = service.new_game(3, 3)            # X on turn
    g = service.apply_move(g, Move(0,0,'X'))
    g = service.apply_move(g, Move(1,0,'O'))
    g = service.apply_move(g, Move(0,1,'X'))
    g = service.apply_move(g, Move(1,1,'O'))
    g = service.apply_move(g, Move(0,2,'X'))  # win on row 0

    assert g.status == 'win'
    assert g.winner == 'X'
    # snapshots: ply 0..5 (including initial)
    assert len(g.snapshots) == 1 + len(g.history)

def test_draw():
    g = service.new_game(3, 3)  # sequence ending in draw, no 3 in a row
    seq = [
        Move(0,0,'X'), Move(0,1,'O'), Move(0,2,'X'),
        Move(1,1,'O'), Move(1,0,'X'), Move(1,2,'O'),
        Move(2,1,'X'), Move(2,0,'O'), Move(2,2,'X'),
    ]
    for m in seq:
        g = service.apply_move(g, m)

    assert g.status == 'draw'
    assert g.winner is None

def test_occupied_and_turn_errors():
    g = service.new_game(3, 3)
    g = service.apply_move(g, Move(0,0,'X'))
    with pytest.raises(ValueError, match="wrong turn"):
        service.apply_move(g, Move(0,1,'X'))   # X is not on turn
    with pytest.raises(ValueError, match="occupied"):
        service.apply_move(g, Move(0,0,'O'))   # occupied
    with pytest.raises(ValueError, match="out of range"):
        service.apply_move(g, Move(9,9,'O'))   # out of range
