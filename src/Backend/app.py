# src/Backend/app.py
from __future__ import annotations
import os
import logging
from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS

from sudoku.routes import sudoku_bp
from minesweeper.routes import minesweeper_bp
from tic_tac_toe import bp as tic_tac_toe_bp   # <<< blueprint je v __init__.py
from sudoku.gridCache import start_cache

def create_app() -> Flask:
    app = Flask(__name__)

    # logging
    level = os.getenv("LOG_LEVEL", "DEBUG").upper()
    logging.basicConfig(level=level, format="%(levelname)s:%(name)s:%(message)s")

    # CORS
    allow_origins = os.getenv("CORS_ORIGINS", "*")
    origins_list = [origin.strip() for origin in allow_origins.split(",")] if allow_origins != "*" else "*"
    CORS(app, resources={r"/api/*": {
        "origins":  origins_list,
        "supports_credentials": True,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Idempotency-Key"]
        }})
    app.secret_key = os.getenv("CORS_KEY", "ourITU-super42secretkey64")
    app.permanent_session_lifetime = timedelta(weeks=1)
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['SESSION_COOKIE_SECURE'] = True

    # blueprints
    app.register_blueprint(sudoku_bp,      url_prefix="/api/sudoku")
    app.register_blueprint(tic_tac_toe_bp)  # <<< už má url_prefix="/api/tictactoe"
    app.register_blueprint(minesweeper_bp, url_prefix="/api/minesweeper")

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({"status": "healthy", "message": "Backend is running"})

    @app.get("/api/games")
    def get_games():
        return jsonify({
            "games": [
                {"id": 1, "name": "Sudoku",       "path": "/sudoku"},
                {"id": 2, "name": "Tic-tac-toe",  "path": "/tic_tac_toe"},
                {"id": 3, "name": "Minesweeper",  "path": "/minesweeper"},
            ]
        })
    
     # Sudoku chache
    is_reloader_child = os.environ.get("WERKZEUG_RUN_MAIN") == "true"
    is_debug_mode = app.debug or os.getenv("FLASK_DEBUG") == "1"

    # Start if we are in the reloader child OR if we are not using debug mode at all
    if is_reloader_child or not is_debug_mode:
        try:
            start_cache()
        except RuntimeError:
            pass
    
    return app

# umožní `flask --app app:app run`
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
