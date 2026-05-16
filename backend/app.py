from datetime import datetime
import os
from google import genai
from google.genai import types
import firebase_admin
# 👇 NOVITÀ: Ho aggiunto 'auth' agli import di Firebase
from firebase_admin import credentials, firestore, auth
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

app = Flask(__name__)

# 🔒 CORS CONFIGURATO CORRETTAMENTE
# Accettiamo le richieste esterne MA diciamo esplicitamente a Flask di lasciar passare il token di sicurezza
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ☢️ SOLUZIONE NUCLEARE PER IL PREFLIGHT (OPTIONS)
# Intercetta tutte le richieste OPTIONS prima che falliscano e risponde positivamente al browser
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

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

@app.route('/api/check-news', methods=['POST'])
def check_news():
    # ==========================================
    # 🛑 INIZIO BUTTAFUORI (CONTROLLO JWT)
    # ==========================================
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"status": "error", "message": "Accesso negato: Token mancante"}), 401

    token = auth_header.split(' ')[1]

    try:
        # Verifica la firma del token comunicando con Google/Firebase
        decoded_token = auth.verify_id_token(token)
        print(f"✅ Utente autorizzato con UID: {decoded_token['uid']}")
    except Exception as e:
        print(f"❌ Tentativo respinto: {e}")
        return jsonify({"status": "error", "message": "Accesso negato: Token non valido o scaduto"}), 403
    # ==========================================
    # ✅ FINE BUTTAFUORI
    # ==========================================

    try:
        data = request.json
        user_news = data.get('news') or data.get('url')

        if not user_news:
            return jsonify({"status": "error", "message": "Nessun dato fornito"}), 400

        oggi = datetime.now().strftime("%d/%m/%Y")

        # Nuovo prompt con regole ANTI-ALLUCINAZIONE e Fact-Checking severo
        prompt = (
            f"RUOLO: Sei un giornalista di fact-checking severissimo e incorruttibile. La tua priorità assoluta è la verità. NON inventare MAI i fatti per accontentare l'utente.\n"
            f"CONTESTO TEMPORALE: Oggi è il {oggi}. Tieni a mente questa data, ma NON scriverla MAI nella spiegazione finale.\n"

            f"REGOLA EVENTI FUTURI/IN CORSO (ANTI-ALLUCINAZIONE): Se l'utente chiede informazioni su eventi sportivi, politici o sociali che devono ancora avvenire o le cui qualificazioni sono in corso (es. Mondiali 2026), e NON c'è ancora un verdetto storico ufficiale e definitivo, NON devi assolutamente fare previsioni. DEVI rispondere 'NON VERIFICABILE' e spiegare che l'evento è in corso o nel futuro.\n"

            f"TOLLERANZA E INTENTO: Se l'utente fa piccoli errori su anni di edizioni PASSATE (es. AFCON 2026 invece di 2025), ma l'evento principale è realmente accaduto, rispondi VERO e correggi amichevolmente l'imprecisione dell'utente nella spiegazione.\n"

            f"FORMATO OBBLIGATORIO: Devi rispondere ESATTAMENTE in questo formato, usando il carattere '|' come divisore tra il verdetto e la spiegazione. Scegli UNA sola delle tre parole iniziali: \n"
            f"VERO | La tua spiegazione breve qui... \n"
            f"oppure \n"
            f"FALSO | La tua spiegazione breve qui... \n"
            f"oppure \n"
            f"NON VERIFICABILE | La tua spiegazione breve qui... \n"
            f"Non usare mai il grassetto (niente asterischi) per le parole VERO, FALSO o NON VERIFICABILE. \n"
            f"Notizia da analizzare: {user_news}"
        )
        # Chiamata al modello CON ACCESSO A INTERNET (Corretta)
        response = client.models.generate_content(
            model=model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )

        print("Prompt inviato a Gemini")

        testo_grezzo = response.text

        # TRUCCO: Dividiamo la risposta dove trova il simbolo '|'
        if "|" in testo_grezzo:
            parti = testo_grezzo.split("|", 1)
            verdetto = parti[0].strip().upper() # Prende "VERO" o "FALSO" e lo mette in maiuscolo
            spiegazione = parti[1].strip()      # Prende il resto del testo
        else:
            verdetto = "INCERTO"
            spiegazione = testo_grezzo

        # Salvataggio Firebase
        try:
            # Salvataggio Firebase ottimizzato
            db.collection('analisi_effettuate').add({
                'testo': user_news,
                'verdetto': verdetto,  # Campo separato per icone colorate
                'spiegazione': spiegazione,
                'analisi': f"{verdetto} - {spiegazione}",  # Mantieni questo per compatibilità
                'data': datetime.now(),
                'utente_uid': decoded_token['uid']
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


@app.route('/api/get-history', methods=['GET'])
def get_history():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"status": "error", "message": "No token"}), 401

    token = auth_header.split(' ')[1]
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']

        # 🚀 Sfrutta l'indice composto che hai creato su Firebase
        docs = db.collection('analisi_effettuate') \
            .where('utente_uid', '==', uid) \
            .order_by('data', direction=firestore.Query.DESCENDING) \
            .limit(10).get()

        history = []
        for doc in docs:
            d = doc.to_dict()
            history.append({
                "id": doc.id,
                "testo": d.get('testo', 'Nessun testo'),
                "analisi": d.get('analisi', ''),
                "data": d.get('data').strftime("%d/%m %H:%M") if d.get('data') else ""
            })

        return jsonify({"status": "success", "history": history})
    except Exception as e:
        print(f"ERRORE CRITICO: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # host='0.0.0.0' per la connessione del Pixel
    app.run(debug=False, host='0.0.0.0', port=5000)