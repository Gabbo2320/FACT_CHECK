import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, View, Text } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';

// ⚠️ Assicurati che il percorso di Firebase sia corretto!
import { auth } from '../../firebaseConfig';

export default function HomeScreen() {
  const router = useRouter();
  const [notizia, setNotizia] = useState('');
  const [verdetto, setVerdetto] = useState('');
  const [spiegazione, setSpiegazione] = useState('');
  const [caricamento, setCaricamento] = useState(false);

  // Il vero "lucchetto" istantaneo per evitare doppi tap e l'errore 429
  const stoCaricando = useRef(false);

  // 👇 CONTROLLO SICUREZZA (Route Protection) 👇
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/');
      }
    });
    return () => unsubscribe();
  }, []);
  // 👆 FINE CONTROLLO SICUREZZA 👆

  // 👇 LA FUNZIONE CORRETTA E "ANTIPROIETTILE" 👇
  const inviaAlBackend = async () => {
    // Se il campo è vuoto o se stiamo già caricando (lucchetto chiuso), blocca tutto!
    if (!notizia || stoCaricando.current) return;

    stoCaricando.current = true; // Chiudi il lucchetto all'istante
    setCaricamento(true);
    setVerdetto('');
    setSpiegazione('');

    try {
      const token = await auth.currentUser?.getIdToken();

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch('https://kratos.vps.webdock.cloud/check-news', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({ news: notizia }),
      });

      const data = await response.json();

      // 🛡️ IL SALVAVITA: Controlliamo se il server ci ha mandato un errore
      if (data.status === 'error') {
        setVerdetto('ERRORE DI SISTEMA');
        setSpiegazione(data.message); // Usiamo 'message' perché il server ci manda questo!
      } else {
        setVerdetto(data.verdetto);
        setSpiegazione(data.spiegazione);
      }

    } catch (error) {
      setVerdetto('ERRORE DI CONNESSIONE');
      setSpiegazione("Il server non risponde. Controlla la connessione a internet o se il backend è attivo.");
      console.error(error);
    } finally {
      stoCaricando.current = false; // Riapri il lucchetto
      setCaricamento(false);
    }
  };
  // 👆 FINE FUNZIONE 👆

  // 👇 FIX PER EVITARE I CRASH DEI COLORI 👇
  const getColoreVerdetto = () => {
    const v = verdetto || ''; // Protezione: se è vuoto, usa una stringa vuota
    if (v.includes('VERO')) return '#4CAF50';
    if (v.includes('FALSO')) return '#d32f2f';
    return '#FF9800'; // Arancione per ERRORI o INCERTO
  };

  const getColoreSfondoAlert = () => {
    const v = verdetto || ''; // Protezione: se è vuoto, usa una stringa vuota
    if (v.includes('VERO')) return '#edf7ed';
    if (v.includes('FALSO')) return '#fdeded';
    return '#fff4e5'; // Giallo tenue per ERRORI o INCERTO
  };

  return (
    <View style={styles.container}>

      <TextInput
        style={styles.input}
        placeholder="Incolla qui la notizia da verificare..."
        placeholderTextColor="#999"
        value={notizia}
        onChangeText={setNotizia}
        multiline
      />

      <TouchableOpacity
        style={styles.button}
        onPress={inviaAlBackend}
        disabled={caricamento}
      >
        {caricamento ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verifica con Gemini</Text>
        )}
      </TouchableOpacity>

      {/* --- SEZIONE RISULTATO --- */}
      {spiegazione ? (
        <ScrollView
          style={styles.resultContainer}
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            styles.alertBox,
            {
              backgroundColor: getColoreSfondoAlert(),
              borderLeftColor: getColoreVerdetto()
            }
          ]}>

            {/* INTESTAZIONE ALERT CORRETTA */}
            <View style={styles.alertHeader}>
              <Text style={styles.alertEmoji}>
                {(verdetto || '').includes('VERO') ? '✅' : (verdetto || '').includes('FALSO') ? '❌' : '⚠️'}
              </Text>
              <Text style={[styles.alertTitle, { color: getColoreVerdetto() }]}>
                {verdetto}
              </Text>
            </View>

            {/* TESTO SPIEGAZIONE */}
            <Text style={styles.alertText}>{spiegazione}</Text>

            {/* DISCLAIMER FINALE */}
            <Text style={styles.alertFooter}>
              Analisi di Gemini • Verifica sempre su fonti ufficiali
            </Text>

          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#ffffff',
  },
  input: {
    width: '100%',
    height: 120,
    borderColor: '#e1e5e8',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fafafa',
    color: '#333'
  },
  button: {
    backgroundColor: '#2b2d31',
    padding: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  resultContainer: {
    flex: 1,
    marginTop: 25,
    width: '100%',
  },
  alertBox: {
    width: '100%',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 8,
    marginBottom: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  alertText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#222',
  },
  alertFooter: {
    marginTop: 15,
    paddingTop: 12,
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
});