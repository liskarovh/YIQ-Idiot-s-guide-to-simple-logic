from __future__ import annotations
from typing import Optional, Dict, Tuple
import time

# In-memory store s TTL (snadná výměna za Redis)
_MEM: Dict[str, Tuple[object, float]] = {}
_TTL_SEC = 2 * 60 * 60  # 2 hodiny


def _now() -> float:
    return time.time()


def _purge_expired() -> None:
    now = _now()
    dead = [k for k, (_, exp) in _MEM.items() if exp < now]
    for k in dead:
        _MEM.pop(k, None)


def get(game_id: str) -> Optional[object]:
    _purge_expired()
    item = _MEM.get(game_id)
    if not item:
        return None
    game, exp = item
    if exp < _now():
        _MEM.pop(game_id, None)
        return None
    return game


def save(game: object) -> None:
    _purge_expired()
    expire_at = _now() + _TTL_SEC
    _MEM[game.id] = (game, expire_at)


def set_ttl(seconds: int) -> None:
    """Možnost přepnout TTL (min 60s)."""
    global _TTL_SEC
    _TTL_SEC = max(60, int(seconds))
