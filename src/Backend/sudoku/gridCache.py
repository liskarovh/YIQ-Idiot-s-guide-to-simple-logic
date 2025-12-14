"""
@file gridCache.py
@brief A multiprocessing-based background cache for pre-generating Sudoku puzzles.

@author David Krejčí <xkrejcd00>
"""
import multiprocessing
import time
import queue
from concurrent.futures import ProcessPoolExecutor
from sudoku.generator import Generator
from sudoku.grid import Grid
from sudoku.sudokuEnums import Difficulty

# --- Configuration ---
MAX_CACHE_SIZE = 3       
MAX_FALLBACK_WORKERS = 2 

# Global variables
manager = None
shared_cache = None
worker_process = None
fallback_executor = None

def generate_task(difficulty, timeout=60):
    """
    @brief Worker function for the ProcessPoolExecutor to generate a single puzzle.
    @param difficulty: The desired Difficulty level.
    @param timeout: Maximum time (in seconds) allowed for generation.
    @returns {Grid} The generated Grid object or None if all attempts fail.
    """
    gen = Generator(Grid)
    
    result = gen.generate(difficulty=difficulty, max_time=timeout, verbose=False)
    
    # Failsafe: If generation timed out, fallback to HARD (faster/more reliable)
    if result is None:
        print(f"[Cache Failsafe] Generation for {difficulty.name} timed out. Falling back to HARD.")
        try:
            result = gen.generate(difficulty=Difficulty.HARD, max_time=30, verbose=False)
        except Exception as e:
            print(f"[Cache Failsafe Error] Fallback also failed: {e}")
            
    return result

def worker_logic(shared_dict):
    """
    @brief The core logic for the background cache worker process.
    @param shared_dict: The multiprocessing.Manager.dict() shared cache.
    """
    gen = Generator(Grid)
    print("[Cache Worker] Started autonomous worker.")

    while True:
        target_diff = None
        
        # Check if any difficulty needs refilling
        for diff in Difficulty:
            try:
                current_list = shared_dict[diff]
                if len(current_list) < MAX_CACHE_SIZE:
                    target_diff = diff
                    break
            except KeyError:
                continue

        if target_diff:
            try:
                result = gen.generate(difficulty=target_diff, max_time=60, verbose=False)
                
                if result:
                    l = shared_dict[target_diff]
                    l.append(result)
                    shared_dict[target_diff] = l 
                    print(f"[Cache Worker] + Added {target_diff.name}. Count: {len(l)}")
                else:
                    time.sleep(1)
            except Exception as e:
                print(f"[Cache Worker] Error generating: {e}")
                time.sleep(1)
        else:
            time.sleep(1.0)

def start_cache():
    """
    @brief Initializes and starts the background cache system.
    """
    global manager, shared_cache, worker_process, fallback_executor
    
    if multiprocessing.current_process().name != 'MainProcess':
        return

    if worker_process and worker_process.is_alive():
        print("[Cache] Worker already running.")
        return

    print("Starting Sudoku Cache (Shared Memory Model)...")
    
    manager = multiprocessing.Manager()
    shared_cache = manager.dict()
    
    fallback_executor = ProcessPoolExecutor(max_workers=MAX_FALLBACK_WORKERS)
    
    for diff in Difficulty:
        shared_cache[diff] = manager.list()
        
    worker_process = multiprocessing.Process(
        target=worker_logic, 
        args=(shared_cache,), 
        daemon=True,
        name="SudokuGenWorker"
    )
    worker_process.start()

def get_grid(difficulty=Difficulty.BASIC):
    """
    @brief Retrieves a Sudoku grid for the specified difficulty.
    @param difficulty: The desired Difficulty level.
    @returns {Grid} A generated Grid object.
    """
    if not shared_cache:
        return _fallback_generate(difficulty)

    try:
        if difficulty in shared_cache:
            p_list = shared_cache[difficulty]
            if len(p_list) > 0:
                grid = p_list.pop(0)
                shared_cache[difficulty] = p_list 
                print(f"[Cache Hit] Served {difficulty.name}. Remaining: {len(p_list)}")
                return grid
    except Exception as e:
        print(f"[Cache Error] {e}")

    return _fallback_generate(difficulty)

def _fallback_generate(difficulty):
    """
    @brief Generates a grid on-demand using the ProcessPoolExecutor.
    @param difficulty: The desired Difficulty level.
    @returns {Grid} A generated Grid object.
    """
    global fallback_executor

    if fallback_executor:
        print(f"[Cache MISS] Offloading generation for {difficulty.name}...")
        future = fallback_executor.submit(generate_task, difficulty)
        
        result = future.result()
        
        if result is None:
             print("[Cache CRITICAL] All generation attempts failed.")
             
        return result

    print(f"[Cache MISS] Sync generation for {difficulty.name}...")
    return generate_task(difficulty)