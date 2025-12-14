"""
@file gameManager.py
@brief Central class for managing the core state and logic of the Sudoku game, including grid manipulation, history, new game initialization, hint generation, and mistake checking.

@author David Krejčí <xkrejcd00>
"""
from sudoku.grid import Grid
from sudoku.gridCache import get_grid
from sudoku.prebuilt_puzzles import get_static_puzzle
from sudoku.sudokuEnums import GameModes, Difficulty
from sudoku.sudokuEnums import CellValue as CV
from sudoku.operationStack import OperationStack
from typing import Optional
import numpy as np
from typing import Dict, Any, List

# Example structures (provided in original file, kept for completeness)
EXAMPLE_GRID: Dict[str, Any] = {
    "values": [[6,0,0,5,7,3,9,4,8],
               [8,7,4,0,9,1,0,6,5],
               [5,9,3,8,6,4,2,7,1],
               [1,6,9,0,2,7,5,8,4],
               [4,5,0,1,0,6,7,3,0],
               [3,8,7,9,4,0,6,1,2],
               [0,3,5,0,1,8,4,0,0],
               [7,0,8,6,0,2,1,9,3],
               [2,1,6,4,3,0,8,5,7]],

    "pencils": [[[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]]],

    "types": [[CV.STARTING,CV.ENTERED,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING],
              [CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING],
              [CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING],
              [CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING],
              [CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED],
              [CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING],
              [CV.ENTERED,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED,CV.ENTERED],
              [CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING],
              [CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING]]
}

EXAMPLE_SOLUTION: Dict[str, Any] = {
    "values": [[6,2,1,5,7,3,9,4,8],
               [8,7,4,2,9,1,3,6,5],
               [5,9,3,8,6,4,2,7,1],
               [1,6,9,3,2,7,5,8,4],
               [4,5,2,1,8,6,7,3,9],
               [3,8,7,9,4,5,6,1,2],
               [9,3,5,7,1,8,4,2,6],
               [7,4,8,6,5,2,1,9,3],
               [2,1,6,4,3,9,8,5,7]],

    "pencils": [[[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]],
                [[],[],[],[],[],[],[],[],[]]],

    "types": [[CV.STARTING,CV.ENTERED,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING],
              [CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING],
              [CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING],
              [CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING],
              [CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED],
              [CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING],
              [CV.ENTERED,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED,CV.ENTERED],
              [CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING],
              [CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.STARTING,CV.ENTERED,CV.STARTING,CV.STARTING,CV.STARTING]]
}

class GameManager:
    """
    @brief Manages the Sudoku game state, including the current board, the solution, and the history stack.
    """
    def __init__(self):
        """
        @brief Initializes the GameManager.
        """
        self.currentBoard: Grid = None
        self.solution: Grid = None
        self.operationStack: OperationStack = OperationStack()

    def newGrid(self, mode: GameModes, difficulty: Any = Difficulty.HARD):
        """
        @brief Initializes a new Sudoku grid based on the mode and difficulty.
        
        Clears the operation stack and sets up the current board and solution board.
        @param mode: The game mode (GENERATED, PREBUILT, LEARN).
        @param difficulty: The difficulty level (for generated/prebuilt) or technique (for learn).
        """
        self.operationStack = OperationStack()
        
        if mode == GameModes.GENERATED:
            # difficulty_or_tech must be a Difficulty Enum here
            result = get_grid(difficulty)
            self.currentBoard = result[0]
            self.solution = result[1]
            return

        # Get data dictionary from prebuilt_puzzles.py for PREBUILT/LEARN modes
        data = get_static_puzzle(mode, difficulty)
        
        # 1. Setup Current Board
        self.currentBoard = Grid()
        
        grid_values = data["values"]
        
        # Default all user-editable cells to ENTERED type
        types = [[CV.ENTERED if val > 0 else CV.ENTERED for val in row] for row in grid_values]
        
        # Create 9x9 empty pencils
        pencils = [[[] for _ in range(9)] for _ in range(9)]
        
        self.currentBoard.update_from_dict({
            "values": grid_values,
            "types": types,
            "pencils": pencils
        })
        
        # Mark clues (pre-filled numbers) as STARTING type so they can't be edited
        self.currentBoard.types[self.currentBoard.values > 0] = CV.STARTING
        
        # 2. Setup Solution Board
        self.solution = Grid()
        self.solution.values = np.array(data["solution"])


    def fillNotes(self):
        """
        @brief Populates the pencil marks/candidates for all empty cells in the current board.
        """
        if self.currentBoard is not None:
            self.currentBoard.make_candidates()

    def revealCell(self, row: int, col: int) -> Optional[int]:
        """
        @brief Reveals the correct value for a specific cell from the solution grid.
        
        Updates the current board and returns the value.
        @param row: The row index (0-8).
        @param col: The column index (0-8).
        @returns {Optional[int]} The correct value, or None if boards are not set or bounds are invalid.
        """
        if self.currentBoard is None or self.solution is None:
            return None
        
        # Check bounds
        if not (0 <= row < 9 and 0 <= col < 9):
            return None

        # Get correct value
        true_value = self.solution.values[row, col]

        # Update current board: Set value, lock type, clear notes
        self.currentBoard.values[row, col] = true_value
        self.currentBoard.types[row, col] = CV.ENTERED # Mark as user-entered for mistake checking
        
        return int(true_value)

    def getMistakes(self) -> List[List[bool]]:
        """
        @brief Compares the current board's user-entered values with the solution.
        
        @returns {List[List[bool]]} A 9x9 boolean matrix (list of lists) where True indicates a mistake (a filled cell that does not match the solution).
        """
        if self.currentBoard is None or self.solution is None:
            return [[False]*9 for _ in range(9)]

        current = self.currentBoard.values
        solution = self.solution.values

        # A mistake is a cell that is filled (not 0) AND does not match solution
        mistakes_mask = (current != 0) & (current != solution)

        return mistakes_mask.tolist()
    
    def getHint(self) -> Optional[Dict[str, Any]]:
        """
        @brief Generates a hint for the user based on game state.
        
        Priority:
        1. Fix Mistakes (if any)
        2. Next logical step (via the Grid solver)
        
        @returns {Optional[Dict[str, Any]]} A dictionary containing hint details (title, explanation, matrix/highlights).
        """
        if self.currentBoard is None or self.solution is None:
            return None

        # --- 1. Check for Mistakes ---
        # Find cells that are filled but don't match the solution
        current_vals = self.currentBoard.values.astype(int)
        solution_vals = self.solution.values.astype(int)
        
        mistakes_mask = (current_vals != 0) & (current_vals != solution_vals)
        
        if np.any(mistakes_mask):
            return {
                "title": "Mistake Found",
                "explanation": "This cell contains an incorrect value.",
                "matrix": mistakes_mask.tolist() 
            }

        # --- 2. Find Next Logical Step ---
        # We work on a copy to simulate the move without changing the real board yet
        hint_grid = self.currentBoard.copy()
        
        # Ensure the hint grid has up-to-date candidates to work with.
        hint_grid.make_candidates()
        
        # Run the finder
        step = hint_grid.find_next_step()
        
        if step:
            return step
            
        # --- 3. Fallback (Puzzle Solved or Too Hard) ---
        if np.all(self.currentBoard.values > 0):
             return {
                "title": "Puzzle Solved",
                "explanation": "The puzzle is already complete!",
                "matrix": [[False]*9 for _ in range(9)]
            }
            
        return {
            "title": "No Hint Available",
            "explanation": "The solver could not find a logical step. You might need to guess.",
            "matrix": [[False]*9 for _ in range(9)]
        }