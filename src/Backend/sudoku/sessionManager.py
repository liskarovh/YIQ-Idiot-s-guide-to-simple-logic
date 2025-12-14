"""
@file sessionManager.py
@brief Handles the lifecycle of SudokuSession objects, including creation, retrieval,
       persistence to disk, and cleanup of expired or excessive sessions.

@author David Krejčí <xkrejcd00>
"""
import os
import json
import uuid
import time
import tempfile
from pathlib import Path
from typing import Dict, Tuple, Optional, Any
from sudoku.session import SudokuSession

# --- Configuration ---
SESSION_DIR = Path("data/sudoku/sessions")
MEMORY_CACHE_LIFETIME = 3600  # 1 hour (Time until a session is dropped from memory cache)
FILE_SESSION_LIFETIME = 604800  # 1 week (Time until a session file is deleted)
MAX_SESSIONS = 100               # Maximum number of session files to keep on disk
CLEANUP_INTERVAL = 600           # Interval (seconds) between cleanup attempts

# Ensure the session directory exists
SESSION_DIR.mkdir(parents=True, exist_ok=True)

# 🧠 In-memory cache: {sid: (SudokuSession, last_used_timestamp)}
_session_cache: Dict[str, Tuple[SudokuSession, float]] = {}
_last_cleanup: float = 0

def _session_path(sid: str) -> Path:
    """
    @brief Constructs the file path for a given session ID.
    @param sid: The session ID (UUID string).
    @returns {Path} The full file path for the session data.
    """
    return SESSION_DIR / f"{sid}.json"

def _cleanup_old_sessions():
    """
    @brief Performs maintenance on the session system.
    
    1. Removes sessions from the in-memory cache if they haven't been used recently.
    2. Deletes session files from disk if they are older than FILE_SESSION_LIFETIME.
    3. Deletes the oldest session files if the total count exceeds MAX_SESSIONS.
    """
    global _last_cleanup
    now = time.time()
    
    if now - _last_cleanup < CLEANUP_INTERVAL:
        return
    
    _last_cleanup = now

    # 1. Clean up in-memory cache
    expired_sids = [
        sid for sid, (_, last_used) in _session_cache.items()
        if now - last_used > MEMORY_CACHE_LIFETIME
    ]
    for sid in expired_sids:
        del _session_cache[sid]

    # 2. Clean up expired session files
    for file in SESSION_DIR.glob("*.json"):
        try:
            mtime = file.stat().st_mtime
            if now - mtime > FILE_SESSION_LIFETIME:
                file.unlink(missing_ok=True)
        except Exception:
            # Clean up on any stat or permission error
            file.unlink(missing_ok=True)

    # 3. Enforce MAX_SESSIONS limit
    files = list(SESSION_DIR.glob("*.json"))
    if len(files) > MAX_SESSIONS:
        # Sort by modification time (mtime) and keep the newest MAX_SESSIONS
        files.sort(key=lambda f: f.stat().st_mtime)
        for f in files[:-MAX_SESSIONS]:
            f.unlink(missing_ok=True)

def get_or_create_session(sid: Optional[str] = None) -> SudokuSession:
    """
    @brief Retrieves an existing session by ID or creates a new one.
    
    The function checks the in-memory cache first, then the disk. If no valid session is 
    found, a new one is created and saved.

    @param sid: Optional existing session ID.
    @returns {SudokuSession} The retrieved or newly created session object.
    """
    _cleanup_old_sessions()

    now = time.time()
    
    # 1. Check in-memory cache
    if sid and sid in _session_cache:
        ses, _ = _session_cache[sid]
        _session_cache[sid] = (ses, now) # Update last used timestamp
        return ses

    # 2. Check disk
    if sid:
        path = _session_path(sid)
        if path.exists():
            try:
                with open(path) as f:
                    data: Dict[str, Any] = json.load(f)
                ses = SudokuSession.from_dict(data["session"])
                ses.sid = sid
                _session_cache[sid] = (ses, now) # Add to memory cache
                return ses
            except Exception as e:
                print(f"Error loading session {sid}: {e}")
                # Pass through to create a new session if disk load failed

    # 3. Create new session
    sid = str(uuid.uuid4())
    ses = SudokuSession()
    ses.sid = sid
    _session_cache[sid] = (ses, now)
    save_session(ses)
    return ses

def save_session(ses: SudokuSession):
    """
    @brief Saves the current state of a SudokuSession to disk and updates the in-memory cache.
    
    Uses an atomic file write mechanism (write to temp file, then rename) to prevent data corruption.
    
    @param ses: The SudokuSession object to save.
    """
    now = time.time()
    _session_cache[ses.sid] = (ses, now) # Update memory cache
    data = {
        "timestamp": now,
        "session": ses.to_dict(),
    }
    
    # Create a temp file in the session directory for atomic write
    fd, tmp_path = tempfile.mkstemp(dir=SESSION_DIR, text=True)
    
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump(data, f)
        # Atomically replace the old file with the new one
        os.replace(tmp_path, _session_path(ses.sid))
    except Exception as e:
        print(f"Error saving session {ses.sid}: {e}")
        os.remove(tmp_path) # Clean up temp file on failure