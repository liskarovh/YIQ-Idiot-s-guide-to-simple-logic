from src.DAL.db import now

def get_db_time_str() -> str | None:
    ts = now()
    return str(ts) if ts is not None else None
