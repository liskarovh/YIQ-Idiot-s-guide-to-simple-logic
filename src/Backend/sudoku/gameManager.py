from sudoku.grid import Grid
from sudoku.gridCache import start_cache, get_grid
from sudoku.sudokuEnums import GameModes
from sudoku.sudokuEnums import CellValue as CV
from sudoku.operationStack import OperationStack
import numpy as np

EXAMPLE_GRID = {
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

EXAMPLE_SOLUTION = {
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
    def __init__(self):
        self.currentBoard: Grid = None
        self.solution: Grid = None
        self.operationStack = OperationStack()

    def newGrid(self, mode):
        self.operationStack = OperationStack()
        
        if mode == GameModes.PREBUILT:
            self.currentBoard = Grid()
            self.currentBoard.update_from_dict(EXAMPLE_GRID)
            self.solution = Grid()
            self.solution.update_from_dict(EXAMPLE_SOLUTION)
        elif mode == GameModes.GENERATED:
            new = get_grid()
            self.currentBoard = new[0]
            self.solution = new[1]


    def fillNotes(self):
        if self.currentBoard is not None:
            self.currentBoard.make_candidates()

    def revealCell(self, row, col):
        """
        Reveals the correct value for a specific cell from the solution grid.
        Updates the current board and returns the value.
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
        self.currentBoard.types[row, col] = CV.ENTERED
        
        return int(true_value)

    def getMistakes(self):
        """
        Compares current board with solution.
        Returns a 9x9 boolean matrix (list of lists) where True indicates a mistake.
        """
        if self.currentBoard is None or self.solution is None:
            return [[False]*9 for _ in range(9)]

        current = self.currentBoard.values
        solution = self.solution.values

        # A mistake is a cell that is filled (not 0) AND does not match solution
        mistakes_mask = (current != 0) & (current != solution)

        return mistakes_mask.tolist()
    
    def getHint(self):
        """
        Generates a hint for the user.
        Priority:
        1. Fix Mistakes
        2. Next logical step (Singles -> Complex)
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
                "matrix": mistakes_mask.tolist() #
            }

        # --- 2. Find Next Logical Step ---
        # We work on a copy to simulate the move without changing the real board yet
        hint_grid = self.currentBoard.copy()
        
        # Ensure the hint grid has up-to-date candidates to work with.
        # This allows hints to work even if the user hasn't filled in pencil marks.
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

