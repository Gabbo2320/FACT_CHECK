from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Permette al frontend di comunicare col backend

@app.route('/check-news', methods=['POST'])
def check_news():
    return jsonify({"status": "ready", "message": "Gemini Flash in attesa!"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
