"""
@file sudokuEnums.py
@brief Defines various enumeration types used across the Sudoku application to standardize 
       internal state, difficulty levels, and game modes.

@author David Krejčí <xkrejcd00>
"""
from enum import Enum, IntEnum
from typing import Dict, Union

class CellValue(IntEnum):
    """
    @brief Defines the source type of a number displayed in a Sudoku grid cell.
    """
    STARTING = 1     # Initial, given value (cannot be changed by user)
    PENCIL = 2       # User-entered pencil mark/note
    ENTERED = 3      # User-entered main value
    
class InputTypes(Enum):
    """
    @brief Defines the primary method for user input interaction.
    """
    SELECT_NUMBER = 0 # User selects a number (1-9), then clicks a cell
    SELECT_CELL = 1   # User selects a cell, then uses a number panel
    POPUP = 2         # Not used in current implementation, reserved for future
    
class HighlighAreas(Enum):
    """
    @brief Defines how cells should be highlighted.
    """
    OFF = 0          # No special area highlighting
    SELECTED = 1     # Highlight the row, column, and box of the selected cell
    ALL_DIGITS = 2   # Highlight all cells containing the selected number
    
class CheckMistakes(Enum):
    """
    @brief Defines the level of mistake checking provided to the user.
    """
    OFF = 0          # No mistake checking
    CONFLICT = 1     # Check only for immediate conflict with rules (row/col/box)
    SOLUTION = 2     # Check for conflict AND against the final solution (reveals all incorrect entries)
    
class Difficulty(IntEnum):
    """
    @brief Puzzle difficulty levels based on required solving techniques. 
    
    The numerical values map to typical grading in Sudoku generators.
    """
    BASIC = 1          # Naked singles, hidden singles only
    EASY = 2           # + Pointing, claiming
    MEDIUM = 3         # + Naked/hidden pairs, triples
    HARD = 4           # + X-Wing, Swordfish
    VERY_HARD = 5      # + XY-Wing, XYZ-Wing
    EXPERT = 6         # + Unique Rectangles, X-Chains
    EXTREME = 7        # + Forcing Chains
    
class GameModes(Enum):
    """
    @brief Defines the source type for a new Sudoku grid.
    """
    LEARN = 0          # Tutorial puzzles focusing on a specific technique
    PREBUILT = 1       # Static, hand-entered puzzles
    GENERATED = 2      # Algorithmically generated puzzles
    
JStoPythonMap: Dict[str, Union[int, CellValue, InputTypes, HighlighAreas, CheckMistakes, GameModes]] = {
    "Given": 1,
    "Pencil": 2,
    "Value": 3,
    "Number": 0,
    "Cell": 1,
    "OFF": 0,
    "Selected": 1,
    "All Digits": 2,
    "Conflict": 1,
    "Solution": 2,
    "Learn": 0,
    "Prebuilt": 1,
    "Generated": 2
}