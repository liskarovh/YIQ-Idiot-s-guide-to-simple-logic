import threading
import time
from sudoku.generator import Generator
from sudoku.grid import Grid

gen = Generator(Grid)

cache = []
cache_lock = threading.Lock()
MAX_CACHE_SIZE = 5
running = True
SLEEP_INCREMENT = 0.2
sleep_time = 0
MAX_SLEEP_TIME = 1

def cache_worker():
    """Continuously fill the cache in a background thread."""
    while running:
        # Check if we should generate, without holding the lock for long
        with cache_lock:
            should_generate = len(cache) < MAX_CACHE_SIZE

        if should_generate:
            # Do generation outside the lock
            result = gen.generate()
            if result is not None:
                # Append result safely
                with cache_lock:
                    cache.append(result)
                    print(f"Cache len: {len(cache)}")
            sleep_time = 0
        else:
            # Sleep briefly to avoid busy-waiting when cache is full
            if sleep_time < MAX_SLEEP_TIME:
                sleep_time += SLEEP_INCREMENT
            time.sleep(sleep_time)

def start_cache():
    """Start the background cache thread."""
    thread = threading.Thread(target=cache_worker, daemon=True)
    thread.start()
    return thread

def stop_cache():
    """Signal the cache thread to stop."""
    global running
    running = False

def get_grid():
    """Get one cached grid, and trigger refill if needed."""
    with cache_lock:
        if cache:
            return cache.pop()
        else:
            # If cache is empty, generate one synchronously as fallback
            return gen.generate()
