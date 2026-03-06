import os
from google import genai
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# Carica le variabili dal file .env
load_dotenv()
# Recupera la chiave
api_key = os.getenv("GEMINI_API_KEY")

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client(api_key=api_key)
model="gemini-3-flash-preview"

@app.route('/check-news', methods=['POST'])
def check_news():
    try:
        data = request.json
        user_news = data.get('news') or data.get('url')  # Accetta entrambi i nomi

        if not user_news:
            return jsonify({"status": "error", "message": "Nessun dato fornito"}), 400

        prompt = f"Analizza se questa notizia è vera o falsa e spiega perché in breve: {user_news}"
        response = client.models.generate_content(
            model=model, contents=prompt
        )

        return jsonify({
            "status": "success",
            "analisi": response.text,
            "analysis": response.text  # Per compatibilità col vecchio frontend
        })

    except Exception as e:
        print(f"Errore durante l'analisi: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    # Rimaniamo sulla porta 5000 come nel tuo progetto attuale
    app.run(debug=True, host='0.0.0.0', port=5000)