from enum import Enum, IntEnum

class CellValue(IntEnum):
    STARTING = 1
    PENCIL = 2
    ENTERED = 3

class InputTypes(Enum):
    SELECT_NUMBER = 0
    SELECT_CELL = 1
    POPUP = 2

class HighlighAreas(Enum):
    OFF = 0
    SELECTED = 1
    ALL_DIGITS = 2

class CheckMistakes(Enum):
    OFF = 0
    CONFLICT = 1
    SOLUTION = 2

class Difficulty(IntEnum):
    """Puzzle difficulty levels based on required solving techniques."""
    BASIC = 1          # Naked singles, hidden singles only
    EASY = 2           # + Pointing, claiming
    MEDIUM = 3         # + Naked/hidden pairs, triples
    HARD = 4           # + X-Wing, Swordfish
    VERY_HARD = 5      # + XY-Wing, XYZ-Wing
    EXPERT = 6         # + Unique Rectangles, X-Chains
    EXTREME = 7        # + Forcing Chains

class GameModes(Enum):
    LEARN = 0
    PREBUILT = 1
    GENERATED = 2

JStoPythonMap = {
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
