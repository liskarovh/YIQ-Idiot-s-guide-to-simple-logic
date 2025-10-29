from typing import Literal, List, Tuple, TypedDict

Cell = Literal[".", "X", "O"]
Board = List[List[Cell]]
Player = Literal["X", "O"]
Move = Tuple[int, int]

class BestMoveRequest(TypedDict):
    board: "Board"
    player: Player
    size: int
    kToWin: int
    difficulty: str
