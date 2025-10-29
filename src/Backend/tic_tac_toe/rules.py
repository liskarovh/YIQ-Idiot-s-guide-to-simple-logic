"""
Pure game rules for Tic-Tac-Toe / Connect-K.

Funkce:
- validate_board(board, size)
- current_player_from_board(board) -> "X" | "O"
- is_legal_move(board, r, c) -> bool
- apply_move(board, r, c, player) -> new_board (copy)
- check_winner(board, k) -> "X" | "O" | "draw" | None
"""
from typing import Optional, Literal, List
from copy import deepcopy

Cell = Literal[".", "X", "O"]
Board = List[List[Cell]]
Player = Literal["X", "O"]

class RulesError(ValueError):
    pass

def validate_board(board: Board, size: int) -> None:
    if not isinstance(board, list) or len(board) != size:
        raise RulesError("Board must be a list with length == size.")
    allowed = {".", "X", "O"}
    for row in board:
        if not isinstance(row, list) or len(row) != size:
            raise RulesError("Each row must be a list with length == size.")
        for c in row:
            if c not in allowed:
                raise RulesError("Invalid cell; allowed are '.', 'X', 'O'.")

def current_player_from_board(board: Board) -> Player:
    x = sum(cell == "X" for row in board for cell in row)
    o = sum(cell == "O" for row in board for cell in row)
    if x == o:
        return "X"
    if x == o + 1:
        return "O"
    raise RulesError("Invalid X/O counts for turn order.")

def is_legal_move(board: Board, r: int, c: int) -> bool:
    n = len(board)
    return 0 <= r < n and 0 <= c < n and board[r][c] == "."

def apply_move(board: Board, r: int, c: int, player: Player) -> Board:
    if not is_legal_move(board, r, c):
        raise RulesError("Illegal move (out of range or occupied).")
    nb = deepcopy(board)
    nb[r][c] = player  # type: ignore[index]
    return nb

def _check_dir(board: Board, r: int, c: int, dr: int, dc: int, k: int) -> bool:
    n = len(board)
    target = board[r][c]
    if target not in ("X", "O"):
        return False
    cnt = 0
    i, j = r, c
    while 0 <= i < n and 0 <= j < n and board[i][j] == target:
        cnt += 1
        if cnt >= k:
            return True
        i += dr
        j += dc
    return False

def check_winner(board: Board, k: int) -> Optional[Literal["X","O","draw"]]:
    n = len(board)
    empty = False
    for r in range(n):
        for c in range(n):
            v = board[r][c]
            if v == ".":
                empty = True
                continue
            # zkontroluj 4 směry: →, ↓, ↘, ↙
            if _check_dir(board, r, c, 0, 1, k):   # horizontální
                return v  # type: ignore[return-value]
            if _check_dir(board, r, c, 1, 0, k):   # vertikální
                return v  # type: ignore[return-value]
            if _check_dir(board, r, c, 1, 1, k):   # diagonála ↘
                return v  # type: ignore[return-value]
            if _check_dir(board, r, c, 1, -1, k):  # diagonála ↙
                return v  # type: ignore[return-value]
    if not empty:
        return "draw"
    return None
