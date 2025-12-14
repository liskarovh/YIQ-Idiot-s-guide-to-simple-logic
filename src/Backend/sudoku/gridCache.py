import multiprocessing
import time
import queue
from concurrent.futures import ProcessPoolExecutor
from sudoku.generator import Generator
from sudoku.grid import Grid
from sudoku.sudokuEnums import Difficulty

# --- Configuration ---
MAX_CACHE_SIZE = 3       # Max puzzles per difficulty in background cache
MAX_FALLBACK_WORKERS = 2 # Max concurrent "on-demand" generations allowed

# Global variables
manager = None
shared_cache = None
worker_process = None
fallback_executor = None

def generate_task(difficulty, timeout=60):
    """
    Worker function for the ProcessPoolExecutor.
    Must be at module level to be picklable.
    """
    gen = Generator(Grid)
    
    # 1. Attempt to generate the requested difficulty
    result = gen.generate(difficulty=difficulty, max_time=timeout, verbose=False)
    
    # 2. FAILSAFE: If generation timed out (returned None), fallback to HARD
    # This prevents the "NoneType is not subscriptable" crash in GameManager
    if result is None:
        print(f"[Cache Failsafe] Generation for {difficulty.name} timed out. Falling back to HARD.")
        try:
            # Fallback to HARD which is much faster/reliable to generate
            result = gen.generate(difficulty=Difficulty.HARD, max_time=30, verbose=False)
        except Exception as e:
            print(f"[Cache Failsafe Error] Fallback also failed: {e}")
            
    return result

def worker_logic(shared_dict):
    """
    This function runs in a separate background process.
    It autonomously checks the shared cache and fills gaps.
    """
    gen = Generator(Grid)
    print("[Cache Worker] Started autonomous worker.")

    while True:
        # 1. Check if any difficulty needs refilling
        target_diff = None
        
        for diff in Difficulty:
            try:
                # We access the shared list safely
                current_list = shared_dict[diff]
                if len(current_list) < MAX_CACHE_SIZE:
                    target_diff = diff
                    break
            except KeyError:
                continue

        # 2. Generate or Sleep
        if target_diff:
            try:
                # Generate puzzle
                result = gen.generate(difficulty=target_diff, max_time=60, verbose=False)
                
                if result:
                    l = shared_dict[target_diff]
                    l.append(result)
                    shared_dict[target_diff] = l # Trigger update
                    print(f"[Cache Worker] + Added {target_diff.name}. Count: {len(l)}")
                else:
                    # If worker times out, just sleep briefly and retry later
                    # (Background worker doesn't need the strict fallback logic)
                    time.sleep(1)
            except Exception as e:
                print(f"[Cache Worker] Error generating: {e}")
                time.sleep(1)
        else:
            time.sleep(1.0)

def start_cache():
    """Starts the autonomous worker process and the fallback executor."""
    global manager, shared_cache, worker_process, fallback_executor
    
    if multiprocessing.current_process().name != 'MainProcess':
        return

    if worker_process and worker_process.is_alive():
        print("[Cache] Worker already running.")
        return

    print("Starting Sudoku Cache (Shared Memory Model)...")
    
    manager = multiprocessing.Manager()
    shared_cache = manager.dict()
    
    # Initialize executor for on-demand fallback requests
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
    Retrieves a grid from the shared cache.
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
    Generates a grid on-demand. Blocks the request thread but releases GIL.
    """
    global fallback_executor

    if fallback_executor:
        print(f"[Cache MISS] Offloading generation for {difficulty.name}...")
        future = fallback_executor.submit(generate_task, difficulty)
        
        # Wait for result
        result = future.result()
        
        # Double check validity before returning
        if result is None:
             # Last ditch effort if even the failsafe in generate_task failed
             print("[Cache CRITICAL] All generation attempts failed.")
             # You might want to return a hardcoded simple grid here if absolutely necessary
             
        return result

    print(f"[Cache MISS] Sync generation for {difficulty.name}...")
    return generate_task(difficulty)