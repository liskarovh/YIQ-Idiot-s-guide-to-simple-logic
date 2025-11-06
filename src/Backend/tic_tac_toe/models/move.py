from dataclasses import dataclass

@dataclass
class Move:
    row: int
    col: int
    player: str  # 'X' or 'O'
