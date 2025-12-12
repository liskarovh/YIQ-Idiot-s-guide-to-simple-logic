from sudoku.grid import Grid
from sudoku.gridCache import start_cache, get_grid
from sudoku.sudokuEnums import GameModes
from sudoku.sudokuEnums import CellValue as CV
from sudoku.operationStack import OperationStack

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

    def cellHint(self):
        pass

    def smartHint(self):
        pass

    def submitHints(self):
        pass

    def getMistakes(self):
        pass

