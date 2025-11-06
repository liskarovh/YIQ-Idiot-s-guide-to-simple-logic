"""
Pure game rules for Tic-Tac-Toe / Connect-K.

Funkce:
- validate_board(board, size)
- current_player_from_board(board) -> "X" | "O"
- is_legal_move(board, r, c) -> bool
- apply_move(board, r, c, player) -> new_board (copy)
- find_winning_sequence(board, k) -> [{"row": r, "col": c}, ...] | []
- check_winner(board, k) -> "X" | "O" | "draw" | None
"""
from typing import Optional, Literal, List, Dict, cast
from copy import deepcopy

Cell   = Literal[".", "X", "O"]
Player = Literal["X", "O"]
Winner = Literal["X", "O", "draw"]
Board  = List[List[Cell]]

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
    """
    Původní směrová kontrola (ponecháno kvůli zpětné kompatibilitě).
    Dnes už check_winner používá find_winning_sequence, která vrací i souřadnice.
    """
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

# ──────────────────────────────────────────────────────────────────────────────
# NOVÉ: vrať přesnou výherní postupku (právě k buněk v řadě), nebo []
# ──────────────────────────────────────────────────────────────────────────────
def find_winning_sequence(board: Board, k: int) -> List[Dict[str, int]]:
    """
    Najde první výherní sekvenci délky k v některém ze 4 směrů (→, ↓, ↘, ↙).
    Vrací seznam dictů {"row": r, "col": c} v pořadí od začátku linie.
    Pokud existuje delší souvislá linie (>k), vrátí prvních k buněk od
    kanonického začátku (tj. tam, kde předchozí v opačném směru není stejný kámen).
    """
    n = len(board)
    dirs = [(0, 1), (1, 0), (1, 1), (1, -1)]
    for r in range(n):
        for c in range(n):
            mark = board[r][c]
            if mark == ".":
                continue
            for dr, dc in dirs:
                # Začátek linie = v opačném směru není stejná značka
                pr, pc = r - dr, c - dc
                if 0 <= pr < n and 0 <= pc < n and board[pr][pc] == mark:
                    continue
                seq: List[Dict[str, int]] = []
                rr, cc = r, c
                while 0 <= rr < n and 0 <= cc < n and board[rr][cc] == mark:
                    seq.append({"row": rr, "col": cc})
                    if len(seq) == k:
                        return seq
                    rr += dr
                    cc += dc
    return []

def check_winner(board: Board, k: int) -> Optional[Winner]:
    """
    Preferuje výsledek z find_winning_sequence (vrací přesné souřadnice).
    Pokud žádná výherní sekvence neexistuje, rozliší 'draw' vs None (running).
    """
    seq = find_winning_sequence(board, k)
    if seq:
        r0, c0 = seq[0]["row"], seq[0]["col"]
        v: Cell = board[r0][c0]
        if v in ("X", "O"):
            # pro typový checker zúžíme z Cell ("."|"X"|"O") na Literal["X","O"]
            return cast(Literal["X", "O"], v)
        # teoreticky nedosažitelné (sekvence nikdy nezačíná ".")
        raise AssertionError("Winning sequence cannot start with '.'")

    # bez výhry: je plno?
    n = len(board)
    empty = any(board[r][c] == "." for r in range(n) for c in range(n))
    return None if empty else "draw"
