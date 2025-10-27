from flask import Flask, jsonify
from flask_cors import CORS

# Import game routes
from sudoku.routes import sudoku_bp
from tic_tac_toe.routes import tic_tac_toe_bp
from minesweeper.routes import minesweeper_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Register game blueprints (sub-routes for each game)
app.register_blueprint(sudoku_bp, url_prefix='/api/sudoku')
app.register_blueprint(tic_tac_toe_bp, url_prefix='/api/tic_tac_toe')
app.register_blueprint(minesweeper_bp, url_prefix='/api/minesweeper')

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'})

@app.route('/api/games', methods=['GET'])
def get_games():
    """Return list of available games"""
    return jsonify({
        'games': [
            {'id': 1, 'name': 'Sudoku', 'path': '/sudoku'},
            {'id': 2, 'name': 'Tic_tac_toe', 'path': '/tic_tac_toe'},
            {'id': 3, 'name': 'Minesweeper', 'path': '/minesweeper'}
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)