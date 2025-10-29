import os
from dataclasses import dataclass

# Limity
SIZE_MIN = 3
SIZE_MAX = int(os.getenv("TTT_SIZE_MAX", "8"))  # ✅ testy očekávají max 8
K_MIN = 3
K_MAX = int(os.getenv("TTT_K_MAX", "5"))


# Timeout pro /best-move (v ms)
TIMEOUT_MS = int(os.getenv("CONNECTK_TIMEOUT_MS", "4000"))

@dataclass(frozen=True)
class DifficultyParams:
    rollouts: int
    greedy: float  # 0.0..1.0 (např. šance na „rychlý“ tah vs. MCTS)

# Výchozí presety (rollouts lze přepsat ENV)
_DEFAULTS = {
    "easy":   DifficultyParams(rollouts=400,   greedy=0.10),
    "medium": DifficultyParams(rollouts=2000,  greedy=0.00),
    "hard":   DifficultyParams(rollouts=8000,  greedy=0.00),
}

def difficulty_params(name: str) -> DifficultyParams:
    n = (name or "medium").strip().lower()
    if n not in _DEFAULTS:
        n = "medium"
    base = _DEFAULTS[n]
    env_key = {
        "easy":   "CONNECTK_ROLLOUTS_EASY",
        "medium": "CONNECTK_ROLLOUTS_MEDIUM",
        "hard":   "CONNECTK_ROLLOUTS_HARD",
    }[n]
    try:
        r = int(os.getenv(env_key, str(base.rollouts)))
    except ValueError:
        r = base.rollouts
    return DifficultyParams(rollouts=r, greedy=base.greedy)

# ---- Přidané pro BE integraci / FE CORS ----
# Původ FE (v dev klidně "*", v prod uveď konkrétní origin)
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")

# Verze enginu/app (používá /api/version a adapter)
ENGINE_VERSION = os.getenv("TTT_ENGINE_VERSION", "py-omega-1.2.0")
