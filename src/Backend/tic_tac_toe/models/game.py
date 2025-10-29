from dataclasses import dataclass, field
from typing import List, Optional, Dict, Literal
from .types import GameStatus
from .move import Move
from .snapshot import BoardSnapshot
from .player import Player

Mode = Literal["pve", "pvp"]

@dataclass
class Game:
    id: str
    size: int
    k_to_win: int
    board: List[List[str]]        # '.', 'X', 'O'
    player: str                   # kdo je na tahu: 'X' nebo 'O'
    status: GameStatus
    winner: Optional[str] = None
    history: List[Move] = field(default_factory=list)
    snapshots: List[BoardSnapshot] = field(default_factory=list)  # timeline

    # režim / hráči
    mode: Mode = "pve"
    start_mark: str = "X"           # kdo začíná
    human_mark: Optional[str] = "X" # jen pro pve; u pvp None
    players: Dict[str, Player] = field(default_factory=dict)      # {'X': Player, 'O': Player}

    # UX / meta
    turn_timer_s: Optional[int] = None  # návrh: FE odpočítává
    created_at: float = 0.0             # epoch seconds
    ended_at: Optional[float] = None    # epoch seconds
    hints_used: int = 0                 # kolikrát bylo zavoláno /best-move na gameId
    difficulty: str = "easy"
