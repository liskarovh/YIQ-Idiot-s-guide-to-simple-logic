"""
@file routes.py
@brief Defines the Flask Blueprint for the Sudoku backend API endpoints.

This module handles session management, retrieving and updating game state, 
generating new grids, revealing cell values, providing hints, and finding mistakes.

@author David Krejčí <xkrejcd00>
"""
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, session as flask_session
from sudoku.sessionManager import get_or_create_session, save_session
from sudoku.sudokuEnums import GameModes, Difficulty
from typing import Dict, Any, Union, List

sudoku_bp = Blueprint('sudoku', __name__)


@sudoku_bp.route("/state", methods=["GET", "POST"])
def state():
    """
    @brief Endpoint for retrieving (GET) and updating (POST) the entire Sudoku game state.

    The state includes the grid data, user settings, game meta-information, and operation history. 
    It also ensures a permanent session cookie is set.
    """
    sid = flask_session.get("sid")
    ses = get_or_create_session(sid)
    
    # Ensure the session ID is stored in the client's session
    flask_session["sid"] = ses.sid
    flask_session.permanent = True

    if request.method == "GET":
        # --- Retrieve State ---
        board = ses.gameManager.currentBoard
        info = ses.gameInfo
        history = ses.gameManager.operationStack.to_dict()
        
        print(f"Sending response to GET for sid {ses.sid}:")
        print("grid", board.to_dict() if board else None)
        print("options", ses.settings.to_dict() if ses.settings else None)
        print("info", info.to_dict() if info else None)
        
        resp = jsonify({
            "grid": board.to_dict() if board else None,
            "options": ses.settings.to_dict() if ses.settings else None,
            "info": info.to_dict() if info else None,
            "history": history
        })

    elif request.method == "POST":
        # --- Update State ---
        data: Dict[str, Any] = request.get_json() or {}
        
        if "grid" in data and ses.gameManager.currentBoard:
            ses.gameManager.currentBoard.update_from_dict(data["grid"])
        if "options" in data and ses.settings:
            ses.settings.update_from_dict(data["options"])
        if "info" in data and ses.gameInfo:
            ses.gameInfo.update_from_dict(data["info"])
        if "history" in data:
            ses.gameManager.operationStack.update_from_list(data["history"])

        print(f"Updating state on request for sid {ses.sid}:")

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
    """
    @brief Endpoint for generating or retrieving a new Sudoku grid based on specified mode and difficulty/identifier.
    """
    sid = flask_session.get("sid")
    ses = get_or_create_session(sid)
    
    # 1. Get Params
    mode_str: str = request.args.get('mode', 'Prebuilt')
    diff_param: str = request.args.get('difficulty', 'Hard')
    
    # 2. Determine Mode
    try:
        # Matches "GENERATED", "PREBUILT", "LEARN"
        mode: GameModes = GameModes[mode_str.upper()] 
    except KeyError:
        mode = GameModes.GENERATED

    # 3. Determine Difficulty/Identifier
    identifier: Union[Difficulty, str]
    
    if mode == GameModes.LEARN:
        # For Learn, the identifier is the string name of the technique (e.g., "Hidden Singles")
        identifier = diff_param 
    else:
        # For Generated/Prebuilt, convert to Difficulty Enum
        try:
            identifier = Difficulty[diff_param.upper()]
        except KeyError:
            identifier = Difficulty.HARD

    print(f"New Grid: Mode={mode.name}, ID={identifier}")

    # 4. Generate the new grid via the manager
    ses.gameManager.newGrid(mode, identifier)
    
    save_session(ses)
    # Return the dictionary representation of the newly created board
    return jsonify(ses.gameManager.currentBoard.to_dict())

@sudoku_bp.route('/get_value', methods=['GET'])
def getValue():
    """
    @brief Endpoint to request the solution value for a specific cell (reveal cell).
    """
    sid = flask_session.get("sid")
    ses = get_or_create_session(sid)
    
    try:
        row: int = int(request.args.get('row'))
        col: int = int(request.args.get('col'))
    except (TypeError, ValueError):
        return jsonify({"err": -1, "message": "Invalid coordinates"}), 400

    # Call the manager to reveal the cell
    revealed_val = ses.gameManager.revealCell(row, col)
    
    if revealed_val is None:
        return jsonify({"err": -1, "message": "Action failed"}), 400

    save_session(ses)
    
    return jsonify({
        "value": revealed_val,
        "err": 0
    })

@sudoku_bp.route('/hint', methods=['GET'])
def getHint():
    """
    @brief Endpoint to request a hint from the game manager.
    """
    sid = flask_session.get("sid")
    ses = get_or_create_session(sid)
    print("got hint request")
    
    # Get hint from manager
    response_data: Dict[str, Any] = ses.gameManager.getHint()
    
    if response_data is None:
        return jsonify({"err": -1, "message": "Game not initialized"}), 400
        
    save_session(ses)
    return jsonify(response_data)

@sudoku_bp.route('/mistakes', methods=['GET'])
def getMistakes():
    """
    @brief Endpoint to retrieve the current mistake matrix for the grid.
    """
    sid = flask_session.get("sid")
    ses = get_or_create_session(sid)
    
    # Calculate mistakes matrix
    mistakes_matrix: List[List[bool]] = ses.gameManager.getMistakes()
    
    return jsonify({
        "mistakes": mistakes_matrix,
        "err": 0
    })