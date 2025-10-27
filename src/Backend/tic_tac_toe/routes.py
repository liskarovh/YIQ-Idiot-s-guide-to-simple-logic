from flask import Blueprint, jsonify, request

tic_tac_toe_bp = Blueprint('tic_tac_toe', __name__)

@tic_tac_toe_bp.route('/hello', methods=['GET'])
def hello():
    """Example endpoint for Tic_tac_toe"""
    return jsonify({
        'message': 'Hello from Tic_tac_toe!',
        'game': 'Tic_tac_toe'
    })

@tic_tac_toe_bp.route('/score', methods=['GET'])
def get_score():
    """Get current score for Tic_tac_toe"""
    return jsonify({
        'score': 250,
        'player': 'Player 2',
        'level': 3
    })

@tic_tac_toe_bp.route('/score', methods=['POST'])
def save_score():
    """Save score for Tic_tac_toe"""
    data = request.get_json()
    score = data.get('score', 0)
    player = data.get('player', 'Unknown')
    
    return jsonify({
        'success': True,
        'message': f'Score {score} saved for {player}',
        'saved_score': score
    })