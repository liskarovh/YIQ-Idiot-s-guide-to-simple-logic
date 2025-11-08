from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, session as flask_session
from sudoku.sessionManager import get_or_create_session, save_session
from sudoku.sudokuEnums import GameModes

sudoku_bp = Blueprint('sudoku', __name__)


@sudoku_bp.route("/state", methods=["GET", "POST", "OPTIONS"])
def state():
    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

    sid = flask_session.get("sid")
    ses = get_or_create_session(sid)
    flask_session["sid"] = ses.sid
    flask_session.permanent = True

    if request.method == "GET":
        board = ses.gameManager.currentBoard
        info = ses.gameInfo
        
        print(f"Sending response to GET for sid {ses.sid}:")
        print("grid", board.to_dict() if board else None)
        print("options", ses.settings.to_dict() if ses.settings else None)
        print("info", info.to_dict() if info else None)
        
        resp = jsonify({
            "grid": board.to_dict() if board else None,
            "options": ses.settings.to_dict() if ses.settings else None,
            "info": info.to_dict() if info else None
        })

    elif request.method == "POST":
        data = request.get_json() or {}
        if "grid" in data and ses.gameManager.currentBoard:
            ses.gameManager.currentBoard.update_from_dict(data["grid"])
        if "options" in data and ses.settings:
            ses.settings.update_from_dict(data["options"])
        if "info" in data and ses.gameInfo:
            ses.gameInfo.update_from_dict(data["info"])

        print(f"Updating state on request for sid {ses.sid}:")
        print(data)

        save_session(ses)
        resp = jsonify({"message": "State updated successfully."})

    # Set cookie with proper configuration
    expires = datetime.now() + timedelta(weeks=1)
    resp.set_cookie(
        "sid",
        value=ses.sid,
        expires=expires,
        httponly=True,
        samesite="Lax",
        path="/"
    )
    
    return resp

    

@sudoku_bp.route('/new_grid', methods=['GET'])
def newBoard():
    # TODO Set candidates?
    # TODO Update game info
    sid = flask_session.get("sid")
    ses = get_or_create_session(sid)
    ses.gameManager.newGrid(GameModes.PREBUILT)
    board = ses.gameManager.currentBoard
    
    print(f"Sending new grid for sid {ses.sid}:")
    print("grid", board.to_dict())

    save_session(ses)
    resp = jsonify(board.to_dict())
    return resp

@sudoku_bp.route('/get_value', methods=['GET'])
def getValue():
    pass

@sudoku_bp.route('/hint', methods=['GET'])
def getHint():
    pass

@sudoku_bp.route('/mistakes', methods=['GET'])
def getMistakes():
    pass