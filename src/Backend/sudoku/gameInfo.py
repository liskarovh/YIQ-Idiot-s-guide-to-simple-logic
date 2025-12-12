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
        self.mode = GameModes(data.get("mode"))
        self.difficulty = data.get("difficulty")
        
        self.timer = data.get("timer")
        self.hintsUsed = data.get("hints", 0) # Default to 0 if 'hints' is missing
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Create a GameInfo instance from a dictionary."""
        mode = GameModes(data.get("mode"))
        difficulty = data.get("difficulty")
        
        # Instantiate with required enum values
        info = cls(mode, difficulty)
        
        # Set optional and state values
        info.timer = data.get("timer")
        info.hintsUsed = data.get("hints", 0) # Default to 0 if 'hints' is missing
        return info