from dataclasses import dataclass, field
from typing import List, Optional, Literal

GameStatus = Literal['running','win','draw']

@dataclass
class Move:
    row: int
    col: int
    player: str  # 'X' or 'O'

@dataclass
class Game:
    id: str
    size: int
    k_to_win: int
    board: List[List[str]]        # '.', 'X', 'O'
    player: str                   # na tahu
    status: GameStatus
    winner: Optional[str] = None  # 'X'/'O' if status=='win'
    history: List[Move] = field(default_factory=list)

