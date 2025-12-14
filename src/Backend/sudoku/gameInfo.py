"""
@file gameInfo.py
@brief Class to manage and serialize/deserialize core meta-information about the currently active Sudoku game session.

@author David Krejčí <xkrejcd00>
"""
from sudoku.sudokuEnums import GameModes
from typing import List, Dict, Any, Optional

class GameInfo:
    """
    @brief Holds context for currently played game's meta-information.
    """
    def __init__(self):
        """
        @brief Initializes a new GameInfo object with default values.
        """
        self.mode: Optional[GameModes] = None
        self.difficulty: int = 1
        self.timer: Optional[int] = None
        self.hintsUsed: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """
        @brief Converts the GameInfo object into a dictionary for API/storage serialization.
        @returns {Dict[str, Any]} Dictionary representation of the game information.
        """
        return {
            "mode": self.mode.value if self.mode else None,
            "difficulty": self.difficulty,
            "timer": self.timer,
            "hints": self.hintsUsed
        }
    
    def update_from_dict(self, data: Dict[str, Any]):
        """
        @brief Updates the GameInfo attributes from a provided dictionary.
        @param data: Dictionary containing new values.
        """
        if not data:
            return
            
        raw_mode = data.get("mode")
        if raw_mode is not None:
            try:
                self.mode = GameModes(raw_mode)
            except ValueError:
                pass # Keep existing mode if invalid value received

        if "difficulty" in data:
            self.difficulty = data.get("difficulty")
        if "timer" in data:
            self.timer = data.get("timer")
        # Use 'hints' key from dictionary for hintsUsed attribute
        if "hints" in data:
            self.hintsUsed = data.get("hints", 0)
    
    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]]):
        """
        @brief Creates a GameInfo instance from a dictionary.
        @param data: Dictionary containing game information. Can be None.
        @returns {GameInfo} A new GameInfo instance.
        """
        if data is None:
            return cls()

        info = cls()
        
        raw_mode = data.get("mode")
        if raw_mode is not None:
            try:
                info.mode = GameModes(raw_mode)
            except ValueError:
                info.mode = None # Fallback
        
        info.difficulty = data.get("difficulty", 1)
        info.timer = data.get("timer")
        info.hintsUsed = data.get("hints", 0)
        
        return info