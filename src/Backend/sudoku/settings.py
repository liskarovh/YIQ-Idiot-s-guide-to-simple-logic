from sudoku.sudokuEnums import HighlighAreas, InputTypes, CheckMistakes, GameModes

class Settings:
    def __init__(self):
        self.notes = False
        self.clear = False
        self.mode = GameModes.GENERATED
        self.generatedDifficulty = 0
        self.learnDifficulty = 0,
        self.prebuiltDifficulty = 1
        self.selectedNumber = 1
        self.selectedCell = {"row": 0, "col": 0}
        self.dragInput = True
        self.autofillNotes = False
        self.explainSmartHints = True
        self.timer = True
        self.highlightCompleted = True
        self.inputType = InputTypes.SELECT_NUMBER
        self.highlighNumbers = True
        self.highlighAreas = False
        self.checkMistakes = CheckMistakes.CONFLICT

    def to_dict(self):
        """Convert settings to frontend-compatible dictionary"""
        return {
            "mode": self.mode.value,
            "generatedDifficulty": self.generatedDifficulty,
            "learnDifficulty": self.learnDifficulty,
            "prebuiltDifficulty": self.prebuiltDifficulty,
            "highlightNumbers": self.highlighAreas,
            "highlightAreas": self.highlighAreas,
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
    
    def update_from_dict(self, data):
        self.mode = GameModes(data.get("mode", self.mode.value))
        self.generatedDifficulty = data.get("generatedDifficulty", self.generatedDifficulty)
        self.learnDifficulty = data.get("learnDifficulty", self.learnDifficulty)
        self.prebuiltDifficulty = data.get("prebuiltDifficulty", self.prebuiltDifficulty)
        self.highlighNumbers = data.get("highlighNumbers", self.highlighNumbers)
        self.highlighAreas = data.get("highlightAreas", self.highlighAreas)
        self.highlightCompleted = data.get("highlightCompleted", self.highlightCompleted)
        self.checkMistakes = CheckMistakes(data.get("checkMistakes", self.checkMistakes.value))
        self.explainSmartHints = data.get("explainSmartHints", self.explainSmartHints)
        self.timer = data.get("timer", self.timer)
        self.autofillNotes = data.get("autofillHints", self.autofillNotes)
        self.inputType = InputTypes(data.get("selectMethod", self.inputType.value))
        self.selectedNumber = data.get("selectedNumber", self.selectedNumber)
        self.selectedCell = data.get("selectedCell", self.selectedCell)
        self.clear = data.get("clear", self.clear)
        self.notes = data.get("notes", self.notes)
    
    @classmethod
    def from_dict(cls, data):
        settings = cls()
        settings.mode = GameModes(data.get("mode", settings.mode.value))
        settings.generatedDifficulty = data.get("generatedDifficulty", settings.generatedDifficulty)
        settings.learnDifficulty = data.get("learnDifficulty", settings.learnDifficulty)
        settings.prebuiltDifficulty = data.get("prebuiltDifficulty", settings.prebuiltDifficulty)
        settings.highlighNumbers = data.get("highlighNumbers", settings.highlighNumbers)
        settings.highlighAreas = data.get("highlightAreas", settings.highlighAreas)
        settings.highlightCompleted = data.get("highlightCompleted", settings.highlightCompleted)
        settings.checkMistakes = CheckMistakes(data.get("checkMistakes", settings.checkMistakes.value))
        settings.explainSmartHints = data.get("explainSmartHints", settings.explainSmartHints)
        settings.timer = data.get("timer", settings.timer)
        settings.autofillNotes = data.get("autofillHints", settings.autofillNotes)
        settings.inputType = InputTypes(data.get("selectMethod", settings.inputType.value))
        settings.selectedNumber = data.get("selectedNumber", settings.selectedNumber)
        settings.selectedCell = data.get("selectedCell", settings.selectedCell)
        settings.clear = data.get("clear", settings.clear)
        settings.notes = data.get("notes", settings.notes)

        return settings
