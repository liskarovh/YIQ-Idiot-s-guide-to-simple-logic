"""
@file session.py
@brief Defines the SudokuSession class, which aggregates all components of an active game 
       (settings, game info, grid, solution, and history) and handles their serialization.

@author David Krejčí <xkrejcd00>
"""
from typing import Optional, Dict, Any, List
from sudoku.operationStack import OperationStack
from sudoku.settings import Settings
from sudoku.gameManager import GameManager
from sudoku.gameInfo import GameInfo
from sudoku.grid import Grid

class SudokuSession:
    """
    @brief Container class holding all data related to a single Sudoku game session.
    """
    def __init__(self):
        """
        @brief Initializes a new session with default component objects.
        """
        self.sid: Optional[str] = None # Session ID, added dynamically by sessionManager
        self.settings = Settings()
        self.gameInfo = GameInfo()
        self.gameManager = GameManager()

    def to_dict(self) -> Dict[str, Any]:
        """
        @brief Converts the entire SudokuSession object into a dictionary for serialization.
        @returns {Dict[str, Any]} Dictionary containing serialized session data.
        """
        grid = self.gameManager.currentBoard.to_dict() if self.gameManager.currentBoard is not None else None
        solution = self.gameManager.solution.to_dict() if self.gameManager.solution is not None else None
        history: List[Dict[str, Any]] = self.gameManager.operationStack.to_dict() if self.gameManager.operationStack is not None else []

        return {
            "settings": self.settings.to_dict() if self.settings is not None else None,
            "info": self.gameInfo.to_dict() if self.gameInfo is not None else None,
            "grid": grid,
            "solution": solution,
            "history": history
         }
    
    @classmethod
    def from_dict(cls, dict_data: Dict[str, Any]) -> 'SudokuSession':
        """
        @brief Creates a SudokuSession instance from a dictionary of serialized data.
        @param dict_data: Dictionary containing the session data.
        @returns {SudokuSession} A new instance populated with the loaded data.
        """
        session = cls()
        
        # Load component objects
        session.settings = Settings.from_dict(dict_data.get("settings"))
        session.gameInfo = GameInfo.from_dict(dict_data.get("info"))
        
        # Load grid and solution
        if "grid" in dict_data and dict_data["grid"]:
            session.gameManager.currentBoard = Grid.from_dict(dict_data["grid"])
        if "solution" in dict_data and dict_data["solution"]:
            session.gameManager.solution = Grid.from_dict(dict_data["solution"])
            
        # Load history stack
        if "history" in dict_data:
            session.gameManager.operationStack = OperationStack.from_list(dict_data["history"])
            
        return session