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
        return {"settings": self.settings.to_dict() if self.settings is not None else None,
         "info": self.gameInfo.to_dict() if self.gameInfo is not None else None,
         "grid": grid,
         "solution": solution
         }
    
    @classmethod
    def from_dict(cls, dict):
        session = SudokuSession()
        session.settings = Settings.from_dict(dict["settings"])
        session.gameInfo = GameInfo.from_dict(dict["info"])
        session.gameManager.currentBoard = Grid.from_dict(dict["grid"])
        session.gameManager.solution = Grid.from_dict(dict["solution"])
        return session
    

