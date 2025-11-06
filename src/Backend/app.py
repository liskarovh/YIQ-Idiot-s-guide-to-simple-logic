# src/Backend/app.py
from __future__ import annotations
import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

# blueprints z mainu
from sudoku.routes import sudoku_bp
from tic_tac_toe.routes import tic_tac_toe_bp   # alias na bp z tic_tac_toe/routes.py
from minesweeper.routes import minesweeper_bp

def create_app() -> Flask:
    app = Flask(__name__)

    # ---------- logging ----------
    level = os.getenv("LOG_LEVEL", "DEBUG").upper()
    logging.basicConfig(level=level, format="%(levelname)s:%(name)s:%(message)s")

    # ---------- CORS ----------
    allow_origins = os.getenv("CORS_ORIGINS", "*")
    CORS(app, resources={r"/api/*": {"origins": allow_origins}})

    # ---------- blueprints ----------
    app.register_blueprint(sudoku_bp,        url_prefix="/api/sudoku")
    app.register_blueprint(tic_tac_toe_bp,   url_prefix="/api/tictactoe")  # sjednoceno
    app.register_blueprint(minesweeper_bp,   url_prefix="/api/minesweeper")

    # ---------- health & catalog ----------
    @app.get("/api/health")
    def health():
        return jsonify({"status": "healthy", "message": "Backend is running"})

    @app.get("/api/games")
    def get_games():
        return jsonify({
            "games": [
                {"id": 1, "name": "Sudoku",       "path": "/sudoku"},
                {"id": 2, "name": "Tic-tac-toe",  "path": "/tic_tac_toe"},  # UI route m?že z?stat s _
                {"id": 3, "name": "Minesweeper",  "path": "/minesweeper"},
            ]
        })

    return app

# pro `flask --app app:app run`
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
