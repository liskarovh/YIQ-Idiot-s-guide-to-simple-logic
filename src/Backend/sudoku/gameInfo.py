from sudoku.sudokuEnums import GameModes
from typing import List, Dict, Any, Optional
class GameInfo:
    def __init__(self):
        self.mode = GameModes.GENERATED
        self.difficulty = 1
        self.time = None
        self.hintsUsed = 0
    
    def to_dict(self):
        return {
            "mode": self.mode.value,
            "difficulty": self.difficulty,
            "time": self.time,
            "hints": self.hintsUsed
        }
    
    def update_from_dict(self, data):
        self.mode = GameModes(data.get("mode"))
        self.difficulty = data.get("difficulty")
        
        self.time = data.get("time")
        self.hintsUsed = data.get("hints", 0) # Default to 0 if 'hints' is missing
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Create a GameInfo instance from a dictionary."""
        mode = GameModes(data.get("mode"))
        difficulty = data.get("difficulty")
        
        # Instantiate with required enum values
        info = cls(mode, difficulty)
        
        # Set optional and state values
        info.time = data.get("time")
        info.hintsUsed = data.get("hints", 0) # Default to 0 if 'hints' is missing
        return info