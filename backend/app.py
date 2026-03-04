import os
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Fondamentale per far parlare Frontend e Backend

# --- CONFIGURAZIONE FIREBASE ---
# Usa il file che abbiamo visto nella tua cartella backend
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# --- CONFIGURAZIONE GEMINI ---
# Sostituisci 'LA_TUA_CHIAVE' con la tua API Key di Google AI Studio
genai.configure(api_key= "AIzaSyCd6uYK6Ca-h7hvApe6d2Jqhp0fzhj4hM8")
model = genai.GenerativeModel('gemini-1.5-flash')


@app.route('/check-news', methods=['POST'])
def check_news():
    try:
        data = request.json
        user_news = data.get('news')

        # 1. Chiediamo a Gemini
        prompt = f"Analizza se questa notizia è vera o falsa e spiega perché in breve: {user_news}"
        response = model.generate_content(prompt)
        verdetto = response.text

        # 2. Salviamo su Firebase
        doc_ref = db.collection('analisi').add({
            'testo_originale': user_news,
            'risposta_ai': verdetto,
            'timestamp': firestore.SERVER_TIMESTAMP
        })

        return jsonify({"status": "success", "analisi": verdetto})

    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)