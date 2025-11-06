from dataclasses import dataclass

@dataclass
class DifficultyPreset:
    name: str          # 'easy' | 'medium' | 'hard' | custom
    rollouts: int
    greedy: float
    size_default: int
    k_default: int
