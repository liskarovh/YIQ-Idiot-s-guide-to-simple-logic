import os
from datetime import datetime
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from urllib.parse import quote_plus

app = FastAPI(title="IS Backend", version="0.1.0")

# --- CORS ---
frontend_origin = os.getenv("FRONTEND_ORIGIN")
allow_origins = [frontend_origin] if frontend_origin else ["*"]
app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
)

# --- DB připojení (volitelné) ---
# Pipeline/Service Connector může nastavit:
#  - AZURE_MYSQL_CONNECTIONSTRING (ve tvaru 'Server=...;Port=...;Database=...;Uid=...;Pwd=...;SslMode=Required;')
#  - nebo použijeme standardní DATABASE_URL (SQLAlchemy): 'mysql+pymysql://user:pass@host:3306/db?ssl=true'
def to_sqlalchemy_url(conn: str) -> Optional[str]:
    if not conn:
        return None
    if conn.startswith("mysql"):
        return conn
    # převod z 'Server=...;...' na SQLAlchemy URL
    try:
        parts = {}
        for item in conn.split(";"):
            if not item.strip():
                continue
            k, v = item.split("=", 1)
            parts[k.strip().lower()] = v.strip()
        host = parts.get("server") or parts.get("host")
        port = parts.get("port", "3306")
        db   = parts.get("database") or parts.get("db")
        user = parts.get("uid") or parts.get("user id") or parts.get("user")
        pwd  = parts.get("pwd") or parts.get("password") or ""
        if not (host and db and user):
            return None
        ssl = parts.get("sslmode", "").lower() in ("required", "verify_ca", "verify_full")
        qp_user = quote_plus(user)
        qp_pwd  = quote_plus(pwd)
        return f"mysql+pymysql://{qp_user}:{qp_pwd}@{host}:{port}/{db}" + ("?ssl=true" if ssl else "")
    except Exception:
        return None

DATABASE_URL = os.getenv("AZURE_MYSQL_CONNECTIONSTRING") or os.getenv("DATABASE_URL")
SA_URL = to_sqlalchemy_url(DATABASE_URL)
engine = create_engine(SA_URL, pool_pre_ping=True, pool_recycle=300) if SA_URL else None

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/time")
def time():
    if not engine:
        return {"db_not_configured": True}
    try:
        with engine.connect() as conn:
            row = conn.execute(text("SELECT NOW()")).fetchone()
            value = row[0]
            if hasattr(value, "isoformat"):
                value = value.isoformat()
            return {"db_time": str(value)}
    except SQLAlchemyError as e:
        return {"db_error": e.__class__.__name__, "message": str(e)}
