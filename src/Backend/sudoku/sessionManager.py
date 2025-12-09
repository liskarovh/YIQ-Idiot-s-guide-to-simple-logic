import os
import json
import uuid
import time
from pathlib import Path
from sudoku.session import SudokuSession

SESSION_DIR = Path("data/sudoku/sessions")
MEMORY_CACHE_LIFETIME = 3600  # 1 hour
FILE_SESSION_LIFETIME = 604800  # 1 week
MAX_SESSIONS = 100

SESSION_DIR.mkdir(parents=True, exist_ok=True)

# 🧠 In-memory cache
_session_cache = {}  # {sid: (session_obj, last_access_time)}
_last_cleanup = 0
CLEANUP_INTERVAL = 600  # Run cleanup every 10 minutes instead of every call

def _session_path(sid):
    return SESSION_DIR / f"{sid}.json"

def _cleanup_old_sessions():
    global _last_cleanup
    now = time.time()
    
    # Skip cleanup if we ran it recently
    if now - _last_cleanup < CLEANUP_INTERVAL:
        return
    
    _last_cleanup = now

    # Clean memory cache (1 hour lifetime)
    expired_sids = [
        sid for sid, (_, last_used) in _session_cache.items()
        if now - last_used > MEMORY_CACHE_LIFETIME
    ]
    for sid in expired_sids:
        del _session_cache[sid]

    # Clean disk sessions (1 week lifetime)
    for file in SESSION_DIR.glob("*.json"):
        try:
            # Use stat for faster timestamp check
            mtime = file.stat().st_mtime
            if now - mtime > FILE_SESSION_LIFETIME:
                file.unlink(missing_ok=True)
        except Exception:
            file.unlink(missing_ok=True)

    # Enforce max file limit
    files = list(SESSION_DIR.glob("*.json"))
    if len(files) > MAX_SESSIONS:
        files.sort(key=lambda f: f.stat().st_mtime)
        for f in files[:-MAX_SESSIONS]:
            f.unlink(missing_ok=True)

def get_or_create_session(sid=None) -> SudokuSession:
    _cleanup_old_sessions()

    now = time.time()
    
    # Check memory cache first
    if sid and sid in _session_cache:
        ses, _ = _session_cache[sid]
        _session_cache[sid] = (ses, now)
        return ses

    # Check disk if sid provided
    if sid:
        path = _session_path(sid)
        if path.exists():
            try:
                with open(path) as f:
                    data = json.load(f)
                ses = SudokuSession.from_dict(data["session"])
                ses.sid = sid
                _session_cache[sid] = (ses, now)
                return ses
            except Exception:
                # Corrupted file, will create new session
                pass

    # Create new session
    sid = str(uuid.uuid4())
    ses = SudokuSession()
    ses.sid = sid
    _session_cache[sid] = (ses, now)
    save_session(ses)
    return ses

def save_session(ses):
    now = time.time()
    _session_cache[ses.sid] = (ses, now)
    data = {
        "timestamp": now,
        "session": ses.to_dict(),
    }
    with open(_session_path(ses.sid), "w") as f:
        json.dump(data, f)