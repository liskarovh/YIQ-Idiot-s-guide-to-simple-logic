# src/Backend/tic_tac_toe/util.py
from __future__ import annotations
from typing import Any, Mapping
from flask import jsonify

def json_error(code: str, message: str, http: int = 400, meta: Mapping[str, Any] | None = None):
    body = {"error": {"code": code, "message": message}}
    if meta:
        body["error"]["meta"] = dict(meta)
    return jsonify(body), http
