from tic_tac_toe.rules import find_winning_sequence, check_winner

def test_diag5_returns_seq_len_5():
    board = [
        ['X','.','.','.','.'],
        ['.','X','.','.','.'],
        ['.','.','X','.','.'],
        ['.','.','.','X','.'],
        ['.','.','.','.','X'],
    ]
    seq = find_winning_sequence(board, 5)
    assert len(seq) == 5
    assert seq[0] == {"row": 0, "col": 0}
    assert seq[-1] == {"row": 4, "col": 4}
    assert check_winner(board, 5) == "X"
