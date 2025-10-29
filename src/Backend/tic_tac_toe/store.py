# src/Backend/tic_tac_toe/store.py
from __future__ import annotations
from typing import Optional, Iterable, Dict
import threading

# Pozn.: typ "Game" používáme jen v type hints (forward reference),
# abychom se vyhnuli cyklickému importu na models.

class MemoryGameStore:
    """
    Jednoduché thread-safe in-memory úložiště her.
    - get(game_id) -> Game | None
    - put(game_id, game) -> None
    - delete(game_id) -> None
    - list_ids() -> list[str]
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._data: Dict[str, "Game"] = {}

    def get(self, game_id: str) -> Optional["Game"]:
        with self._lock:
            return self._data.get(game_id)

    def put(self, game_id: str, game: "Game") -> None:
        with self._lock:
            self._data[game_id] = game

    def delete(self, game_id: str) -> None:
        with self._lock:
            self._data.pop(game_id, None)

    def list_ids(self) -> Iterable[str]:
        with self._lock:
            return list(self._data.keys())

# Exportovaná instance, kterou používá service.py
mem_store = MemoryGameStore()
