from flask import Blueprint, jsonify, request

# Blueprint is a way to organize routes in Flask
# Think of it as a mini-application for Sudoku
sudoku_bp = Blueprint('sudoku', __name__)

@sudoku_bp.route('/hello', methods=['GET'])
def hello():
    """Example endpoint for Sudoku"""
    return jsonify({
        'message': 'Hello from Sudoku!',
        'game': 'Sudoku'
    })

@sudoku_bp.route('/score', methods=['GET'])
def get_score():
    """Get current score for Sudoku"""
    # In real app, you'd fetch from database
    return jsonify({
        'score': 100,
        'player': 'Player 1',
        'level': 5
    })

@sudoku_bp.route('/score', methods=['POST'])
def save_score():
    """Save score for Sudoku"""
    # Get JSON data from request
    data = request.get_json()
    
    # In real app, you'd save to database
    score = data.get('score', 0)
    player = data.get('player', 'Unknown')
    
    return jsonify({
        'success': True,
        'message': f'Score {score} saved for {player}',
        'saved_score': score
    })

@sudoku_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get leaderboard for Sudoku"""
    # Mock data - in real app, query database
    leaderboard = [
        {'rank': 1, 'player': 'Alice', 'score': 1000},
        {'rank': 2, 'player': 'Bob', 'score': 900},
        {'rank': 3, 'player': 'Charlie', 'score': 800}
    ]
    
    return jsonify({
        'leaderboard': leaderboard
    })