from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)

# Get frontend origin from environment variable
frontend_origin = os.getenv('FRONTEND_ORIGIN', 'http://localhost:3000')
CORS(app, origins=[frontend_origin])

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({
        'message': 'Hello World from Python Backend!',
        'status': 'success'
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)