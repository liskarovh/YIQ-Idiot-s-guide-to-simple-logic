from sudoku.operationStack import OperationStack
from sudoku.settings import Settings
from sudoku.gameManager import GameManager
from sudoku.gameInfo import GameInfo
from sudoku.grid import Grid

class SudokuSession:
    def __init__(self):
        self.settings = Settings()
        self.gameInfo = GameInfo()
        self.gameManager = GameManager()

    def to_dict(self):
        grid = self.gameManager.currentBoard.to_dict() if self.gameManager.currentBoard is not None else None
        solution = self.gameManager.solution.to_dict() if self.gameManager.solution is not None else None
        history = self.gameManager.operationStack.to_dict() if self.gameManager.operationStack is not None else []

        return {
            "settings": self.settings.to_dict() if self.settings is not None else None,
            "info": self.gameInfo.to_dict() if self.gameInfo is not None else None,
            "grid": grid,
            "solution": solution,
            "history": history
         }
    
    @classmethod
    def from_dict(cls, dict_data):
        session = SudokuSession()
        session.settings = Settings.from_dict(dict_data.get("settings"))
        session.gameInfo = GameInfo.from_dict(dict_data.get("info"))
        
        if "grid" in dict_data and dict_data["grid"]:
            session.gameManager.currentBoard = Grid.from_dict(dict_data["grid"])
        if "solution" in dict_data and dict_data["solution"]:
            session.gameManager.solution = Grid.from_dict(dict_data["solution"])
            
        # Load history
        if "history" in dict_data:
            session.gameManager.operationStack = OperationStack.from_list(dict_data["history"])
            
        return session
    

