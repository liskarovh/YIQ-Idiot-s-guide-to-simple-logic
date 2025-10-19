import os
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

_DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("AZURE_MYSQL_CONNECTIONSTRING") or ""
engine: Engine | None = create_engine(_DATABASE_URL, pool_pre_ping=True) if _DATABASE_URL else None

def now():
    if not engine:
        return None
    with engine.connect() as conn:
        return conn.execute(text("SELECT NOW()")).scalar()
    return None
