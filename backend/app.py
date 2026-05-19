from datetime import datetime
import os
import json  # 🔍 NUOVO: Gestione dati JSON per Serper
import requests  # 🔍 NUOVO: Libreria per fare la richiesta HTTP a Serper
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

# --- CONFIGURAZIONI ---
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
serper_key = os.getenv("SERPER_API_KEY")  # 🔍 Legge la chiave Serper dal file .env

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

        # ==========================================
        # 🔍 NUOVO: RICERCA IN TEMPO REALE CON SERPER (GOOGLE SEARCH)
        # ==========================================
        contesto_web = ""
        try:
            print(f"🌐 Eseguo ricerca reale su Google (via Serper) per: {user_news}")

            url = "https://google.serper.dev/search"
            payload = json.dumps({
                "q": user_news,
                "gl": "it",  # Forza la ricerca geografica in Italia
                "hl": "it"  # Richiede i risultati in lingua italiana
            })
            headers = {
                'X-API-KEY': serper_key or "INCOLLA_QUI_LA_TUA_CHIAVE_SERPER_SE_NON_USI_ENV",
                'Content-Type': 'application/json'
            }

            risposta_serper = requests.post(url, headers=headers, data=payload, timeout=5)
            dati_serper = risposta_serper.json()

            # Estraiamo i riassunti (snippet) dei primi 4 risultati di Google
            if 'organic' in dati_serper:
                risultati = [f"- {item.get('title')}: {item.get('snippet')}" for item in dati_serper['organic'][:4]]
                contesto_web = "\n".join(risultati)
                print("🌐 Dati da Google Search recuperati con successo!")
            else:
                contesto_web = "Nessun risultato d'attualità trovato sul web per questa ricerca."

        except Exception as se:
            print(f"⚠️ Errore durante la ricerca Serper: {se}")
            contesto_web = "Impossibile recuperare dati in tempo reale (servizio momentaneamente non raggiungibile)."

        # ==========================================
        # 📝 PROMPT AGGIORNATO CON IL CONTESTO WEB REALE
        # ==========================================
        prompt = (
            f"RUOLO: Sei un giornalista di fact-checking severissimo e incorruttibile. La tua priorità assoluta è la verità. NON inventare MAI i fatti per accontentare l'utente.\n"
            f"CONTESTO TEMPORALE: Oggi è il {oggi}. Tieni a mente questa data, ma NON scriverla MAI nella spiegazione finale.\n\n"
            f"DATI RECENTI RECUPERATI DA GOOGLE SEARCH (Usa queste informazioni reali come fonte primaria per verificare la notizia):\n"
            f"{contesto_web}\n\n"
            f"REGOLA EVENTI FUTURI/IN CORSO (ANTI-ALLUCINAZIONE): Se l'utente chiede informazioni su eventi sportivi, politici o sociali che devono ancora avvenire o le cui qualificazioni sono in corso (es. Mondiali 2026), e NON c'è ancora un verdetto storico ufficiale e definitivo nei dati di Google Search sopra riportati, NON devi assolutamente fare previsioni. DEVI rispondere 'NON VERIFICABILE' e spiegare che l'evento è in corso o nel futuro.\n"
            f"TOLLERANZA E INTENTO: Se l'utente fa piccoli errori su anni di edizioni PASSATE (es. AFCON 2026 invece di 2025), ma l'evento principale è realmente accaduto, rispondi VERO e correggi amichevolmente l'imprecisione dell'utente nella spiegazione.\n"
            f"FORMATO OBBLIGATORIO: Devi rispondere ESATTAMENTE in questo formato, usando il carattere '|' come divisore tra il verdetto e la spiegazione. Scegli UNA sola delle tre parole iniziali: \n"
            f"VERO | La tua spiegazione breve qui... \n"
            f"oppure \n"
            f"FALSO | La tua spiegazione breve qui... \n"
            f"oppure \n"
            f"NON VERIFICABILE | La tua spiegazione breve qui... \n"
            f"Non usare mai il grassetto (niente asterischi) per le parole VERO, FALSO o NON VERIFICABILE. \n\n"
            f"Notizia da analizzare: {user_news}"
        )

        print("Inviando prompt strutturato a Gemini...")

        # Chiamata pulita senza 'config' nativo: evitiamo definitivamente il blocco 429
        response = client.models.generate_content(
            model=model_id,
            contents=prompt
        )

        print("Risposta ricevuta da Gemini")
        testo_grezzo = response.text

        # TRUCCO: Dividiamo la risposta dove trova il simbolo '|'
        if "|" in testo_grezzo:
            parti = testo_grezzo.split("|", 1)
            verdetto = parti[0].strip().upper()  # Prende "VERO" o "FALSO" e lo mette in maiuscolo
            spiegazione = parti[1].strip()  # Prende il resto del testo
        else:
            verdetto = "INCERTO"
            spiegazione = testo_grezzo

        # Salvataggio Firebase
        try:
            db.collection('analisi_effettuate').add({
                'testo': user_news,
                'verdetto': verdetto,  # Campo separato per icone colorate
                'spiegazione': spiegazione,
                'analisi': f"{verdetto} - {spiegazione}",  # Mantieni questo per compatibilità
                'data': datetime.now(),
                'utente_uid': decoded_token['uid']
            })
            print("✅ Analisi salvata su Firestore")
        except Exception as fe:
            print(f"Errore Database: {fe}")

        # Ora mandiamo all'app DUE dati separati, non più uno solo!
        return jsonify({
            "status": "success",
            "verdetto": verdetto,
            "spiegazione": spiegazione
        })

    except Exception as e:
        print(f"Errore Generale: {e}")
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

        docs = db.collection('analisi_effettuate') \
            .where('utente_uid', '==', uid) \
            .order_by('data', direction=firestore.Query.DESCENDING) \
            .limit(10).get()

        history = []
        for doc in docs:
            d = doc.to_dict()

            # Recuperiamo i nuovi campi separati
            verdetto = d.get('verdetto')
            spiegazione = d.get('spiegazione')

            # 💡 SALVAGENTE: Se è una notizia vecchia che non aveva i campi separati,
            # separiamo la vecchia stringa 'analisi' usando il trattino '-'
            if (not verdetto or not spiegazione) and "-" in d.get('analisi', ''):
                parti = d.get('analisi').split("-", 1)
                verdetto = parti[0].strip()
                spiegazione = parti[1].strip()

            history.append({
                "id": doc.id,
                "testo": d.get('testo', 'Nessun testo'),
                "verdetto": verdetto or "INCERTO",  # <--- Ora passiamo il verdetto alla Home!
                "spiegazione": spiegazione or d.get('analisi', ''),  # <--- E la spiegazione!
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