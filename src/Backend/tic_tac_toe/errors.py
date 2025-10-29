# src/Backend/tic_tac_toe/errors.py
from __future__ import annotations
from werkzeug.exceptions import HTTPException, NotFound, MethodNotAllowed, BadRequest, UnprocessableEntity
from .util import json_error

def register_error_handlers(app):
    @app.errorhandler(BadRequest)
    def _bad_request(e: BadRequest):
        # např. špatné JSON tělo apod.
        msg = e.description or "Bad request"
        return json_error("BadRequest", msg, 400)

    @app.errorhandler(UnprocessableEntity)
    def _unprocessable(e: UnprocessableEntity):
        # Flask někdy mapuje validační problémy na 422
        msg = e.description or "Unprocessable entity"
        return json_error("InvalidInput", msg, 422)

    @app.errorhandler(NotFound)
    def _not_found(e: NotFound):
        return json_error("NotFound", "Endpoint not found", 404)

    @app.errorhandler(MethodNotAllowed)
    def _method_not_allowed(e: MethodNotAllowed):
        return json_error("MethodNotAllowed", "HTTP method not allowed on this endpoint", 405)

    @app.errorhandler(HTTPException)
    def _http_exception(e: HTTPException):
        # fallback pro ostatní HTTP výjimky
        code = e.code or 500
        msg = e.description or "HTTP error"
        err = "HttpError" if code < 500 else "Internal"
        return json_error(err, msg, code)

    @app.errorhandler(Exception)
    def _uncaught(e: Exception):
        # poslední záchrana: nepropouštět HTML 500, vždy JSON
        # (sem si případně přidej logger.exception(e))
        return json_error("Internal", "Unexpected server error", 500)
