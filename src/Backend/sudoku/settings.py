"""
@file settings.py
@brief Defines the Settings class for managing user preferences and game options. 
       This class handles serialization to and deserialization from dictionary format.

@author David Krejčí <xkrejcd00>
"""
from typing import Dict, Any, Union
from sudoku.sudokuEnums import HighlighAreas, InputTypes, CheckMistakes, GameModes

class Settings:
    """
    @brief Holds all user-configurable options for the Sudoku game.
    """
    def __init__(self):
        """
        @brief Initializes a new Settings object with default values.
        """
        self.notes: bool = False
        self.clear: bool = False
        self.mode: GameModes = GameModes.PREBUILT
        self.generatedDifficulty: int = 1
        self.learnDifficulty: int = 1
        self.prebuiltDifficulty: int = 1
        self.selectedNumber: int = 1
        self.selectedCell: Dict[str, int] = {"row": 0, "col": 0}
        self.dragInput: bool = True 
        self.autofillNotes: bool = False
        self.explainSmartHints: bool = True
        self.timer: bool = True
        self.highlightCompleted: bool = True
        self.inputType: InputTypes = InputTypes.SELECT_NUMBER
        self.highlighNumbers: bool = True 
        self.highlighAreas: HighlighAreas = HighlighAreas.SELECTED 
        self.checkMistakes: CheckMistakes = CheckMistakes.CONFLICT

    def to_dict(self) -> Dict[str, Any]:
        """
        @brief Converts the Settings object into a dictionary for serialization/API transfer.
        @returns {Dict[str, Any]} Dictionary representation of the settings.
        """
        # Ensure highlightAreas is serialized as its integer value if it's an Enum
        area_value = self.highlighAreas.value if isinstance(self.highlighAreas, HighlighAreas) else self.highlighAreas

        return {
            "mode": self.mode.value,
            "generatedDifficulty": self.generatedDifficulty,
            "learnDifficulty": self.learnDifficulty,
            "prebuiltDifficulty": self.prebuiltDifficulty,
            "highlightNumbers": self.highlighNumbers,
            "highlightAreas": area_value,
            "highlightCompleted": self.highlightCompleted,
            "checkMistakes": self.checkMistakes.value,
            "explainSmartHints": self.explainSmartHints,
            "timer": self.timer,
            "autofillHints": self.autofillNotes,
            "selectMethod": self.inputType.value,
            "selectedNumber": self.selectedNumber,
            "selectedCell": self.selectedCell,
            "clear": self.clear,
            "notes": self.notes
        }
    
    def update_from_dict(self, data: Dict[str, Any]):
        """
        @brief Updates the Settings attributes from a provided dictionary.
        @param data: Dictionary containing new values.
        """
        if not data:
            return

        # Update Enums with safety checks
        self.mode = GameModes(data.get("mode", self.mode.value))
        
        try:
            self.checkMistakes = CheckMistakes(data.get("checkMistakes", self.checkMistakes.value))
        except ValueError:
            pass
            
        try:
            self.inputType = InputTypes(data.get("selectMethod", self.inputType.value))
        except ValueError:
            pass

        # Update Difficulty Settings
        self.generatedDifficulty = data.get("generatedDifficulty", self.generatedDifficulty)
        self.learnDifficulty = data.get("learnDifficulty", self.learnDifficulty)
        self.prebuiltDifficulty = data.get("prebuiltDifficulty", self.prebuiltDifficulty)
        
        # Update Visual/Highlight Settings
        self.highlighNumbers = data.get("highlightNumbers", self.highlighNumbers)
        
        raw_area = data.get("highlightAreas")
        if raw_area is not None:
            try:
                self.highlighAreas = HighlighAreas(raw_area)
            except ValueError:
                pass # Keep existing if invalid value received

        self.highlightCompleted = data.get("highlightCompleted", self.highlightCompleted)
        
        # Update Gameplay Settings
        self.explainSmartHints = data.get("explainSmartHints", self.explainSmartHints)
        self.timer = data.get("timer", self.timer)
        self.autofillNotes = data.get("autofillHints", self.autofillNotes)
        
        # Update Input State
        self.selectedNumber = data.get("selectedNumber", self.selectedNumber)
        self.selectedCell = data.get("selectedCell", self.selectedCell)
        self.clear = data.get("clear", self.clear)
        self.notes = data.get("notes", self.notes)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Settings':
        """
        @brief Creates a Settings instance from a dictionary.
        @param data: Dictionary containing settings information. Can be None.
        @returns {Settings} A new Settings instance.
        """
        if data is None:
            return cls()

        settings = cls()
        
        # Load Enums
        settings.mode = GameModes(data.get("mode", settings.mode.value))
        
        try:
            settings.checkMistakes = CheckMistakes(data.get("checkMistakes", settings.checkMistakes.value))
        except ValueError:
            pass 

        try:
            settings.inputType = InputTypes(data.get("selectMethod", settings.inputType.value))
        except ValueError:
            pass

        # Load Difficulties
        settings.generatedDifficulty = data.get("generatedDifficulty", settings.generatedDifficulty)
        settings.learnDifficulty = data.get("learnDifficulty", settings.learnDifficulty)
        settings.prebuiltDifficulty = data.get("prebuiltDifficulty", settings.prebuiltDifficulty)
        
        # Load Highlights
        settings.highlighNumbers = data.get("highlightNumbers", settings.highlighNumbers)
        
        raw_area = data.get("highlightAreas")
        if raw_area is not None:
             try:
                 settings.highlighAreas = HighlighAreas(raw_area)
             except ValueError:
                 pass

        settings.highlightCompleted = data.get("highlightCompleted", settings.highlightCompleted)
        
        # Load Gameplay
        settings.explainSmartHints = data.get("explainSmartHints", settings.explainSmartHints)
        settings.timer = data.get("timer", settings.timer)
        settings.autofillNotes = data.get("autofillHints", settings.autofillNotes)
        
        # Load Input State
        settings.selectedNumber = data.get("selectedNumber", settings.selectedNumber)
        settings.selectedCell = data.get("selectedCell", settings.selectedCell)
        settings.clear = data.get("clear", settings.clear)
        settings.notes = data.get("notes", settings.notes)

        return settings