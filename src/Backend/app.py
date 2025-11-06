from __future__ import annotations
import logging
import os
from flask import Flask, send_from_directory
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)

    # ---------- logging ----------
    level = os.getenv("LOG_LEVEL", "DEBUG").upper()
    logging.basicConfig(
        level=level,
        format="%(levelname)s:%(name)s:%(message)s",
    )

    # ---------- CORS ----------
    allow_origins = os.getenv("CORS_ORIGINS", "*")
    CORS(app, resources={r"/api/*": {"origins": allow_origins}})

    # ---------- blueprints ----------
    from tic_tac_toe import bp as ttt_bp
    app.register_blueprint(ttt_bp)

    @app.get("/api/health")
    def health():
        return {"ok": True}, 200

    return app


app = create_app()
