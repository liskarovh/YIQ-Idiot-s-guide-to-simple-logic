from sudoku.sudokuEnums import GameModes
from typing import List, Dict, Any, Optional

class GameInfo:
    def __init__(self):
        self.mode = None
        self.difficulty = 1
        self.timer = None
        self.hintsUsed = 0
    
    def to_dict(self):
        return {
            "mode": self.mode.value if self.mode else None,
            "difficulty": self.difficulty,
            "timer": self.timer,
            "hints": self.hintsUsed
        }
    
    def update_from_dict(self, data):
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
        if "hints" in data:
            self.hintsUsed = data.get("hints", 0)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Create a GameInfo instance from a dictionary."""
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