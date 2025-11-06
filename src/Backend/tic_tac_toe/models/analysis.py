from dataclasses import dataclass
from typing import Optional

@dataclass
class BestMoveAnalysis:
    row: int
    col: int
    explain: str
    policy_hint: Optional[str] = None
    rollout_count: Optional[int] = None
    greedy_value: Optional[float] = None
    elapsed_ms: Optional[int] = None
