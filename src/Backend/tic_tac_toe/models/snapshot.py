from dataclasses import dataclass
from typing import List, Optional
from .move import Move

@dataclass
class BoardSnapshot:
    ply: int                     # pořadí tahu (0..N)
    board: List[List[str]]       # kopie desky po aplikaci tahu
    last_move: Optional[Move]    # tah, který vedl ke snapshotu (None = start)
