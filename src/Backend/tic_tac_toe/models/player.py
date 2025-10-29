from dataclasses import dataclass
from typing import Optional, Literal

PlayerKind = Literal["human", "ai"]

@dataclass
class Player:
    id: str
    nickname: Optional[str] = None
    kind: PlayerKind = "human"
