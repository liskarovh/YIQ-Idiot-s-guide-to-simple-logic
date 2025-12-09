import numpy as np
import random
import time
from sudoku.grid import Grid
from sudoku.sudokuEnums import Difficulty, CellValue


class Generator:
    """
    Sudoku puzzle generator that creates puzzles of specific difficulty.
    Uses incremental clue removal and efficient state management.
    """
    
    def __init__(self, grid_class):
        """
        Initialize generator with a Grid class.
        
        Args:
            grid_class: The Grid class to use for puzzle generation
        """
        self.Grid = grid_class
        
    def generate(self, difficulty=Difficulty.EASY, max_time=300, verbose=True):
        """
        Generate a puzzle of specified difficulty.
        
        Args:
            difficulty: Target difficulty level (Difficulty enum)
            max_time: Maximum generation time in seconds
            verbose: Print progress information
            
        Returns:
            Grid object with generated puzzle, or None if timeout
        """
        start_time = time.time()
        attempts = 0
        
        if verbose:
            print(f"Generating {Difficulty(difficulty).name} puzzle...")
            print(f"Maximum time: {max_time}s")
        
        while time.time() - start_time < max_time:
            attempts += 1
            
            if verbose and attempts % 10 == 0:
                elapsed = time.time() - start_time
                print(f"  Attempt {attempts}, elapsed: {elapsed:.1f}s")
            
            # Generate a complete solved grid
            grid = self._generate_solved_grid()
            
            if grid is None:
                continue
                
            # Remove clues to create puzzle
            puzzle = self._remove_clues(grid, difficulty, start_time, max_time, verbose)
            
            if puzzle is not None:
                elapsed = time.time() - start_time
                clues = np.sum(puzzle.values > 0)
                if verbose:
                    print(f"\n✓ Success! Generated in {elapsed:.2f}s after {attempts} attempts")
                    print(f"  Clues: {clues}/81")
                return [puzzle, grid]
        
        if verbose:
            print(f"\n✗ Timeout after {attempts} attempts")
        return None
    
    def _generate_solved_grid(self):
        """Generate a complete, valid Sudoku solution using backtracking."""
        grid = self.Grid()
        
        # Start with empty grid
        if self._fill_grid(grid, 0, 0):
            return grid
        return None
    
    def _fill_grid(self, grid, row, col):
        """Recursively fill grid with valid values using backtracking."""
        # Move to next row if we've filled this row
        if col == 9:
            return self._fill_grid(grid, row + 1, 0)
        
        # Successfully filled entire grid
        if row == 9:
            return True
        
        # Try random order of digits 1-9
        digits = list(range(1, 10))
        random.shuffle(digits)
        
        for num in digits:
            if self._is_valid_placement(grid, row, col, num):
                grid.values[row, col] = num
                grid.types[row, col] = CellValue.STARTING
                
                if self._fill_grid(grid, row, col + 1):
                    return True
                
                grid.values[row, col] = 0
                grid.types[row, col] = CellValue.ENTERED
        
        return False
    
    def _is_valid_placement(self, grid, row, col, num):
        """Check if placing num at (row, col) is valid."""
        # Check row
        if num in grid.values[row, :]:
            return False
        
        # Check column
        if num in grid.values[:, col]:
            return False
        
        # Check box
        box_row, box_col = (row // 3) * 3, (col // 3) * 3
        if num in grid.values[box_row:box_row+3, box_col:box_col+3]:
            return False
        
        return True
    
    def _remove_clues(self, grid, target_difficulty, start_time, max_time, verbose):
        """
        Remove clues from solved grid to create a puzzle of target difficulty.
        Uses incremental solving to optimize performance.
        """
        # Create list of all cell positions
        cells = [(r, c) for r in range(9) for c in range(9)]
        random.shuffle(cells)
        
        removed_count = 0
        
        for r, c in cells:
            # Check timeout
            if time.time() - start_time > max_time:
                return None
            
            # Try removing this clue
            saved_value = grid.values[r, c]
            grid.values[r, c] = 0
            grid.types[r, c] = CellValue.ENTERED
            
            # Check if puzzle is still valid and has unique solution
            if self._check_valid_puzzle(grid, target_difficulty):
                removed_count += 1
                if verbose and removed_count % 10 == 0:
                    clues_left = 81 - removed_count
                    print(f"    Removed {removed_count} clues ({clues_left} remaining)...")
            else:
                # Restore the clue
                grid.values[r, c] = saved_value
        
        # Set types after generation is complete
        for r in range(9):
            for c in range(9):
                if grid.values[r, c] > 0:
                    grid.types[r, c] = CellValue.STARTING
                else:
                    grid.types[r, c] = CellValue.ENTERED
        
        # Final validation
        if self._validate_final_puzzle(grid, target_difficulty):
            return grid
        
        return None
    
    def _check_valid_puzzle(self, grid, target_difficulty):
        """
        Check if puzzle is valid (unique solution at target difficulty).
        This is the main bottleneck in generation.
        """
        # Quick uniqueness check using backtracking
        if not self._has_unique_solution(grid):
            return False
        
        # Check if solvable at target difficulty
        difficulty = self._get_puzzle_difficulty(grid, target_difficulty)
        
        return difficulty <= target_difficulty
    
    def _validate_final_puzzle(self, grid, target_difficulty):
        """Final validation that puzzle requires target difficulty."""
        if not self._has_unique_solution(grid):
            return False
        
        difficulty = self._get_puzzle_difficulty(grid, target_difficulty)
        
        # We want puzzles that require exactly the target difficulty
        # or are slightly easier (within 1 level)
        return difficulty >= target_difficulty - 1 and difficulty <= target_difficulty
    
    def _has_unique_solution(self, grid):
        """
        Check if puzzle has exactly one solution using backtracking.
        Returns True if unique, False otherwise.
        """
        test_grid = self.Grid()
        test_grid.values = grid.values.copy()
        
        solutions = []
        self._count_solutions(test_grid, 0, 0, solutions, max_solutions=2)
        
        return len(solutions) == 1
    
    def _count_solutions(self, grid, row, col, solutions, max_solutions=2):
        """Count solutions using backtracking (stops at max_solutions)."""
        if len(solutions) >= max_solutions:
            return
        
        # Move to next row
        if col == 9:
            self._count_solutions(grid, row + 1, 0, solutions, max_solutions)
            return
        
        # Found a complete solution
        if row == 9:
            solutions.append(grid.values.copy())
            return
        
        # Skip filled cells
        if grid.values[row, col] != 0:
            self._count_solutions(grid, row, col + 1, solutions, max_solutions)
            return
        
        # Try each digit
        for num in range(1, 10):
            if self._is_valid_placement(grid, row, col, num):
                grid.values[row, col] = num
                self._count_solutions(grid, row, col + 1, solutions, max_solutions)
                grid.values[row, col] = 0
                
                if len(solutions) >= max_solutions:
                    return
    
    def _get_puzzle_difficulty(self, grid, max_difficulty):
        """
        Determine the difficulty of a puzzle by trying to solve it
        with progressively harder techniques.
        
        Returns the minimum difficulty level required to solve.
        """
        # Create a fresh grid for solving
        solve_grid = self.Grid()
        solve_grid.values = grid.values.copy()
        # Don't copy types - let make_candidates handle it
        
        # Initialize candidates
        solve_grid.make_candidates()
        
        # Try solving with techniques at each difficulty level
        max_difficulty_found = Difficulty.BASIC
        made_progress = True
        while(made_progress and not self._is_solved(solve_grid)):
            if max_difficulty_found > max_difficulty:
                return max_difficulty_found
            
            made_progress = False
            
            # BASIC: Naked singles, hidden singles
            if solve_grid.solve_naked_singles() > 0:
                made_progress = True
                continue
            
            if solve_grid.solve_hidden_singles() > 0:
                made_progress = True
                continue
            
            # EASY: Pointing, claiming
            if solve_grid.solve_pointing_pairs() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.EASY)
                continue
            
            if solve_grid.solve_claiming() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.EASY)
                continue
            
            # MEDIUM: Naked/hidden sets
            if solve_grid.solve_naked_sets(2) > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.MEDIUM)
                continue
            
            if solve_grid.solve_hidden_sets(2) > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.MEDIUM)
                continue
            
            if solve_grid.solve_naked_sets(3) > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.MEDIUM)
                continue
            
            if solve_grid.solve_hidden_sets(3) > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.MEDIUM)
                continue
            
            # HARD: Fish patterns
            if solve_grid.solve_xwing() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.HARD)
                continue
            
            if solve_grid.solve_swordfish() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.HARD)
                continue
            
            # VERY_HARD: Wing patterns
            if solve_grid.solve_xy_wing() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.VERY_HARD)
                continue
            
            if solve_grid.solve_xyz_wing() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.VERY_HARD)
                continue
            
            # EXPERT: Unique rectangles
            if solve_grid.solve_unique_rectangles() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.EXPERT)
                continue
            
            # EXTREME: X-chains, Forcing chains
            if solve_grid.solve_x_chains() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.EXTREME)
                continue

            if solve_grid.solve_forcing_chains() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.EXTREME)
                continue
            
        
        # If solved, return the highest technique used
        if self._is_solved(solve_grid):
            return max_difficulty
        
        # Could not solve - puzzle is too hard
        return Difficulty.EXTREME + 1
    
    def _is_solved(self, grid):
        """Check if grid is completely solved."""
        return np.all(grid.values > 0)


# Example usage and timing code
if __name__ == "__main__":
    gen = Generator(Grid)
    
    # Test different difficulty levels
    difficulties = [
        Difficulty.BASIC,
        # Difficulty.EASY,
        # Difficulty.MEDIUM,
        # Difficulty.HARD,
        # Difficulty.VERY_HARD,
        # Difficulty.EXPERT,    # Uncomment to test harder levels
        # Difficulty.EXTREME,
    ]
    
    print("=" * 60)
    print("SUDOKU PUZZLE GENERATOR - TIMING TEST")
    print("=" * 60)
    
    for diff in difficulties:
        print(f"\n{'='*60}")
        puzzle = gen.generate(difficulty=diff, max_time=300, verbose=True)
        
        if puzzle:
            print("\nGenerated puzzle:")
            print(puzzle[0])
            print("\nSolution:")
            print(puzzle[1])
        else:
            print("\nFailed to generate puzzle within time limit")
        
        print(f"{'='*60}")