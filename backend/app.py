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

        oggi = datetime.now().strftime("%d/%m/%Y")

        # Nuovo prompt: gli ordiniamo di usare il simbolo '|' per dividere le due cose
        prompt = (
            f"REGOLE TASSATIVE DI CONTESTO: Il tuo orologio segna il {oggi}. Usa questa data solo internamente. "
            f"Non menzionare MAI il 2024 o 2025. "
            f"Devi rispondere ESATTAMENTE in questo formato, usando il carattere '|' come divisore: "
            f"VERO | La tua spiegazione breve qui... "
            f"oppure "
            f"FALSO | La tua spiegazione breve qui... "
            f"Non usare mai il grassetto (niente asterischi) per la parola VERO o FALSO. "
            f"Notizia da analizzare: {user_news}"
        )

        response = client.models.generate_content(
            model=model_id,
            contents=prompt
        )

        testo_grezzo = response.text

        # TRUCCO: Dividiamo la risposta dove trova il simbolo '|'
        if "|" in testo_grezzo:
            parti = testo_grezzo.split("|", 1)
            verdetto = parti[0].strip().upper() # Prende "VERO" o "FALSO" e lo mette in maiuscolo
            spiegazione = parti[1].strip()      # Prende il resto del testo
        else:
            verdetto = "INCERTO"
            spiegazione = testo_grezzo

        # Salvataggio Firebase (opzionale se lo stavi usando)
        try:
            db.collection('analisi_effettuate').add({
                'testo': user_news,
                'analisi': f"{verdetto} - {spiegazione}",
                'data': datetime.now()
            })
        except Exception as fe:
            print(f"Errore Database: {fe}")

        # Ora mandiamo all'app DUE dati separati, non più uno solo!
        return jsonify({
            "status": "success",
            "verdetto": verdetto,
            "spiegazione": spiegazione
        })

    except Exception as e:
        print(f"Errore: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # host='0.0.0.0' per la connessione del Pixel
    app.run(debug=True, host='0.0.0.0', port=5000)