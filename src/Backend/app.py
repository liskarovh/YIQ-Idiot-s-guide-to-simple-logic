# src/Backend/app.py
from __future__ import annotations
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import NotFound, MethodNotAllowed, BadRequest

log = logging.getLogger(__name__)

def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    logging.basicConfig(level=logging.DEBUG)

    # --- Blueprint s tic-tac-toe API ---
    from tic_tac_toe import bp as ttt_bp
    app.register_blueprint(ttt_bp, url_prefix="/api/tictactoe")

    # --- Health / Version ---
    @app.get("/api/health")
    def api_health():
        return jsonify({"ok": True})

    @app.get("/api/version")
    def api_version():
        # verzi AI klidně načítáš jinde; tady jednoduché echo
        return jsonify({"version": "py-omega-1.2.0"})

    # --- JSON error handlers (404/405/400/500) ---
    @app.errorhandler(NotFound)
    def _h404(e: NotFound):
        return jsonify({"error": {"code": "NotFound", "message": str(e)}}), 404

    @app.errorhandler(MethodNotAllowed)
    def _h405(e: MethodNotAllowed):
        return jsonify({"error": {"code": "MethodNotAllowed", "message": str(e)}}), 405

    @app.errorhandler(BadRequest)
    def _h400(e: BadRequest):
        return jsonify({"error": {"code": "BadRequest", "message": str(e)}}), 400

    @app.errorhandler(Exception)
    def _h500(e: Exception):
        log.exception("Unhandled exception on %s %s", request.method, request.path)
        return jsonify({"error": {"code": "Internal", "message": str(e)}}), 500

    return app

# Umožní: `python3 -m flask --app app run -p 5000`
app = create_app()
