"""
@file generator.py
@brief Sudoku puzzle generator that creates puzzles of specific difficulty using incremental clue removal and unique solution verification via backtracking.

@author David Krejčí <xkrejcd00>
"""
import numpy as np
import random
import time
from sudoku.grid import Grid
from sudoku.sudokuEnums import Difficulty, CellValue
from typing import Optional, List, Any


class Generator:
    """
    @brief Sudoku puzzle generator that creates puzzles of specific difficulty.
    Uses incremental clue removal and efficient state management.
    """
    
    def __init__(self, grid_class: Any):
        """
        @brief Initialize generator with a Grid class.
        
        @param grid_class: The Grid class to use for puzzle generation.
        """
        self.Grid = grid_class
        
    def generate(self, difficulty: Difficulty = Difficulty.EASY, max_time: int = 300, verbose: bool = True) -> Optional[List[Grid]]:
        """
        @brief Generate a puzzle of specified difficulty.
        
        @param difficulty: Target difficulty level (Difficulty enum).
        @param max_time: Maximum generation time in seconds.
        @param verbose: Print progress information.
            
        @returns {Optional[List[Grid]]} A list containing [puzzle_grid, solution_grid], or None if timeout.
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
            puzzle_grid = grid.copy()
            puzzle = self._remove_clues(puzzle_grid, difficulty, start_time, max_time, verbose)
            
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
    
    def _generate_solved_grid(self) -> Optional[Grid]:
        """
        @brief Generate a complete, valid Sudoku solution using backtracking.
        
        @returns {Optional[Grid]} A fully solved Grid object, or None if generation failed.
        """
        grid = self.Grid()
        
        # Start with empty grid
        if self._fill_grid(grid, 0, 0):
            return grid
        return None
    
    def _fill_grid(self, grid: Grid, row: int, col: int) -> bool:
        """
        @brief Recursively fill grid with valid values using backtracking.
        
        @param grid: The Grid object being filled.
        @param row: Current row index.
        @param col: Current column index.
        @returns {bool} True if the grid was successfully filled from this point.
        """
        # Move to next row if we've filled this row
        if col == 9:
            return self._fill_grid(grid, row + 1, 0)
        
        # Successfully filled entire grid
        if row == 9:
            return True
        
        # Skip filled cells (only happens if the initial grid wasn't empty)
        if grid.values[row, col] != 0:
            return self._fill_grid(grid, row, col + 1)
        
        # Try random order of digits 1-9
        digits = list(range(1, 10))
        random.shuffle(digits)
        
        for num in digits:
            if self._is_valid_placement(grid, row, col, num):
                grid.values[row, col] = num
                grid.types[row, col] = CellValue.STARTING
                
                if self._fill_grid(grid, row, col + 1):
                    return True
                
                # Backtrack
                grid.values[row, col] = 0
                grid.types[row, col] = CellValue.ENTERED
        
        return False
    
    def _is_valid_placement(self, grid: Grid, row: int, col: int, num: int) -> bool:
        """
        @brief Check if placing num at (row, col) is valid according to Sudoku rules.
        
        @param grid: The Grid object.
        @param row: Row index.
        @param col: Column index.
        @param num: The number to place.
        @returns {bool} True if placement is valid, False otherwise.
        """
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
    
    def _remove_clues(self, grid: Grid, target_difficulty: Difficulty, start_time: float, max_time: int, verbose: bool) -> Optional[Grid]:
        """
        @brief Incrementally removes clues from a solved grid while maintaining uniqueness and difficulty control.
        
        @param grid: The solved Grid object to modify into a puzzle.
        @param target_difficulty: The desired minimum difficulty level.
        @param start_time: The time generation started (for timeout check).
        @param max_time: Maximum time allowed for generation.
        @param verbose: Print progress information.
        @returns {Optional[Grid]} The puzzle Grid object, or None if timeout or difficulty check failed.
        """
        cells = [(r, c) for r in range(9) for c in range(9)]
        random.shuffle(cells)
        
        removed_count = 0
        last_difficulty_check = 0
        current_difficulty = Difficulty.BASIC
        
        for r, c in cells:
            if time.time() - start_time > max_time:
                return None
            
            # Try removing this clue
            saved_value = grid.values[r, c]
            grid.values[r, c] = 0
            grid.types[r, c] = CellValue.ENTERED
            
            # Check uniqueness first (fast check)
            if not self._has_unique_solution(grid):
                grid.values[r, c] = saved_value
                continue
            
            # Every 5 removals, check actual difficulty
            if removed_count - last_difficulty_check >= 5:
                # Check difficulty up to one level above the target
                current_difficulty = self._get_puzzle_difficulty(grid, target_difficulty + 1)
                last_difficulty_check = removed_count
                
                if verbose:
                    print(f"    Removed {removed_count}, current difficulty: {Difficulty(current_difficulty).name}")
                
                # If we've reached target difficulty, become more selective
                if current_difficulty >= target_difficulty:
                    # Test if removing the next clue would drop the difficulty too much
                    test_diff = self._get_puzzle_difficulty(grid, target_difficulty + 1)
                    if test_diff < target_difficulty:
                        # Revert the removal if it drops the difficulty below target
                        grid.values[r, c] = saved_value
                        continue
            
            removed_count += 1
            
            if verbose and removed_count % 10 == 0:
                clues_left = 81 - removed_count
                print(f"    Removed {removed_count} clues ({clues_left} remaining)...")
        
        # Set final types
        for r in range(9):
            for c in range(9):
                if grid.values[r, c] > 0:
                    grid.types[r, c] = CellValue.STARTING
                else:
                    grid.types[r, c] = CellValue.ENTERED
        
        # Final validation
        final_difficulty = self._get_puzzle_difficulty(grid, target_difficulty + 1)
        
        if verbose:
            print(f"    Final difficulty: {Difficulty(final_difficulty).name} (target: {Difficulty(target_difficulty).name})")
        
        # Accept if at target or within 1 level below
        if final_difficulty >= target_difficulty - 1:
            return grid
        
        return None
    
    # Note: _check_valid_puzzle and _validate_final_puzzle were simplified/merged into _remove_clues logic in the original.
    # The definitions are kept simple here as requested by the original code structure.
    
    def _check_valid_puzzle(self, grid: Grid, target_difficulty: Difficulty) -> bool:
        """
        @brief Quick uniqueness check during removal.
        """
        return self._has_unique_solution(grid)
    
    def _validate_final_puzzle(self, grid: Grid, target_difficulty: Difficulty) -> bool:
        """
        @brief Final validation that puzzle has a unique solution and requires the target difficulty level (or close).
        """
        if not self._has_unique_solution(grid):
            return False
        
        difficulty = self._get_puzzle_difficulty(grid, target_difficulty)
        
        # We want puzzles that require exactly the target difficulty
        # or are slightly easier (within 1 level)
        return difficulty >= target_difficulty - 1 and difficulty <= target_difficulty
    
    def _has_unique_solution(self, grid: Grid) -> bool:
        """
        @brief Check if puzzle has exactly one solution using backtracking.
        
        @param grid: The current Grid state (puzzle).
        @returns {bool} True if unique solution exists, False otherwise (0 or >1 solutions).
        """
        test_grid = self.Grid()
        test_grid.values = grid.values.copy()
        
        solutions: List[np.ndarray] = []
        self._count_solutions(test_grid, 0, 0, solutions, max_solutions=2)
        
        return len(solutions) == 1
    
    def _count_solutions(self, grid: Grid, row: int, col: int, solutions: List[np.ndarray], max_solutions: int = 2):
        """
        @brief Count solutions using backtracking (stops at max_solutions).
        
        @param grid: The test Grid object.
        @param row: Current row index.
        @param col: Current column index.
        @param solutions: List to store found solutions.
        @param max_solutions: Maximum number of solutions to find before stopping.
        """
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
        
        # Skip filled cells (clues)
        if grid.values[row, col] != 0:
            self._count_solutions(grid, row, col + 1, solutions, max_solutions)
            return
        
        # Try each digit
        for num in range(1, 10):
            if self._is_valid_placement(grid, row, col, num):
                grid.values[row, col] = num
                self._count_solutions(grid, row, col + 1, solutions, max_solutions)
                grid.values[row, col] = 0 # Backtrack
                
                if len(solutions) >= max_solutions:
                    return
    
    def _get_puzzle_difficulty(self, grid: Grid, max_difficulty: Difficulty) -> int:
        """
        @brief Determine the difficulty of a puzzle by trying to solve it
        with progressively harder techniques.
        
        @param grid: The puzzle Grid object.
        @param max_difficulty: The maximum difficulty enum to test up to.
        @returns {int} The minimum difficulty level required to solve (as an integer enum value), or +1 if unsolvable.
        """
        # Create a fresh grid for solving
        solve_grid = self.Grid()
        solve_grid.values = grid.values.copy()
        
        # Initialize candidates
        solve_grid.make_candidates()
        
        # Try solving with techniques at each difficulty level
        max_difficulty_found = Difficulty.BASIC
        made_progress = True
        while(made_progress and not self._is_solved(solve_grid)):
            # If we exceed max_difficulty, stop and return the exceeded value
            if max_difficulty_found > max_difficulty:
                return max_difficulty_found
            
            made_progress = False
            
            # --- BASIC (Naked/Hidden Singles) ---
            if solve_grid.solve_naked_singles() > 0:
                made_progress = True
                continue
            
            if solve_grid.solve_hidden_singles() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.EASY)
                continue
            
            # --- EASY (Pointing/Claiming) ---
            if solve_grid.solve_pointing_pairs() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.EASY)
                continue
            
            if solve_grid.solve_claiming() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.EASY)
                continue
            
            # --- MEDIUM (Naked/Hidden Pairs/Triplets) ---
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
            
            # --- HARD (Fish Patterns: X-Wing, Swordfish) ---
            if solve_grid.solve_xwing() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.HARD)
                continue
            
            if solve_grid.solve_swordfish() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.HARD)
                continue
            
            # --- VERY_HARD (Wing Patterns: XY-Wing, XYZ-Wing) ---
            if solve_grid.solve_xy_wing() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.VERY_HARD)
                continue
            
            if solve_grid.solve_xyz_wing() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.VERY_HARD)
                continue
            
            # --- EXPERT (Unique Rectangles) ---
            if solve_grid.solve_unique_rectangles() > 0:
                made_progress = True
                max_difficulty_found = max(max_difficulty_found, Difficulty.EXPERT)
                continue
            
            # --- EXTREME (Chains) ---
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
            return max_difficulty_found.value
        
        # Could not solve - puzzle is too hard (or requires advanced guessing/trial-and-error)
        return Difficulty.EXTREME.value + 1
    
    def _is_solved(self, grid: Grid) -> bool:
        """
        @brief Check if grid is completely solved (all cells filled).
        
        @param grid: The Grid object.
        @returns {bool} True if solved, False otherwise.
        """
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
        # Difficulty.EXPERT,
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
            # Assuming Grid has a working __str__ or __repr__
            print(puzzle[0])
            print("\nSolution:")
            print(puzzle[1])
        else:
            print("\nFailed to generate puzzle within time limit")
        
        print(f"{'='*60}")