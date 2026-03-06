from datetime import datetime
import os
from google import genai
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# --- CONFIGURAZIONI ---
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Manteniamo il TUO modello specifico
client = genai.Client(api_key=api_key)
model_id = "gemini-3-flash-preview"

# --- CONFIGURAZIONE FIREBASE ---
try:
    cred = credentials.Certificate("firebase-key.json")
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Errore Firebase: {e}")

@app.route('/check-news', methods=['POST'])
def check_news():
    try:
        data = request.json
        user_news = data.get('news') or data.get('url')

        if not user_news:
            return jsonify({"status": "error", "message": "Nessun dato fornito"}), 400

        # --- DATA AUTOMATICA ---
        # Legge l'ora del tuo PC: oggi è il 06/03/2026
        oggi = datetime.now().strftime("%d/%m/%Y")

        # Prompt con il contesto temporale per non far sbagliare il modello
        prompt = (
            f"Oggi è il {oggi}. Analizza se questa notizia è vera o falsa e spiega perché in breve. "
            f"Se l'URL contiene la data di oggi, considerala attuale: {user_news}"
        )

        # Chiamata con il TUO modello gemini-3-flash-preview
        response = client.models.generate_content(
            model=model_id,
            contents=prompt
        )

        verdetto = response.text

        # --- SALVATAGGIO FIREBASE ---
        try:
            db.collection('analisi_effettuate').add({
                'testo': user_news,
                'analisi': verdetto,
                'data': datetime.now()
            })
        except Exception as fe:
            print(f"Errore Database: {fe}")

        return jsonify({
            "status": "success",
            "analisi": verdetto,
            "analysis": verdetto
        })

    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # host='0.0.0.0' per la connessione del Pixel
    app.run(debug=True, host='0.0.0.0', port=5000)