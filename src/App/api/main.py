from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from src.BL.services import get_db_time_str

app = FastAPI()

allowed = [os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")]
app.add_middleware(CORSMiddleware, allow_origins=allowed, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/time")
def time():
    return {"db_time": get_db_time_str() or "db_not_configured"}
