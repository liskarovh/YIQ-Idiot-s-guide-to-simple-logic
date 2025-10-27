from flask import Blueprint, jsonify, request

minesweeper_bp = Blueprint('minesweeper', __name__)

@minesweeper_bp.route('/hello', methods=['GET'])
def hello():
    """Example endpoint for Minesweeper"""
    return jsonify({
        'message': 'Hello from Minesweeper!',
        'game': 'Minesweeper'
    })

@minesweeper_bp.route('/score', methods=['GET'])
def get_score():
    """Get current score for Minesweeper"""
    return jsonify({
        'score': 500,
        'player': 'Player 3',
        'level': 7
    })

@minesweeper_bp.route('/score', methods=['POST'])
def save_score():
    """Save score for Minesweeper"""
    data = request.get_json()
    score = data.get('score', 0)
    player = data.get('player', 'Unknown')
    
    return jsonify({
        'success': True,
        'message': f'Score {score} saved for {player}',
        'saved_score': score
    })