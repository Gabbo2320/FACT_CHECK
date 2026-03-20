import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, View, Text } from 'react-native';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router'; // 👈 AGGIUNTO QUESTO

// ⚠️ Assicurati che il percorso di Firebase sia corretto!
import { auth } from '../firebaseConfig';

export default function HomeScreen() {
  const router = useRouter(); // 👈 AGGIUNTO QUESTO
  const [notizia, setNotizia] = useState('');
  const [verdetto, setVerdetto] = useState('');
  const [spiegazione, setSpiegazione] = useState('');
  const [caricamento, setCaricamento] = useState(false);

  // Funzione per il Logout AGGIORNATA 👈
  const handleLogout = () => {
    signOut(auth).then(() => {
      // Quando esci con successo, ti rimanda al Login!
      router.replace('/login');
    }).catch((error) => {
      alert("Errore durante il logout: " + error.message);
    });
  };

  const inviaAlBackend = async () => {
    if (!notizia) return;
    setCaricamento(true);
    setVerdetto('');
    setSpiegazione('');

    try {
      // ⚠️ Assicurati che il tuo server Flask sia acceso su questo IP!
      const response = await fetch('http://10.176.37.91:5000/check-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news: notizia }),
      });

      const data = await response.json();
      setVerdetto(data.verdetto);       // Gemini ci passa la parola VERO o FALSO
      setSpiegazione(data.spiegazione); // Gemini ci passa la spiegazione

    } catch (error) {
      setSpiegazione("Errore: il backend non risponde. Controlla che Flask sia attivo e connesso alla stessa rete WiFi!");
      console.error(error);
    } finally {
      setCaricamento(false);
    }
  };

  // Funzione che sceglie il colore in base al verdetto
  const getColoreVerdetto = () => {
    if (verdetto.includes('VERO')) return '#4CAF50'; // Verde brillante
    if (verdetto.includes('FALSO')) return '#F44336'; // Rosso acceso
    return '#FF9800'; // Arancione se è un risultato incerto
  };

  return (
    <View style={styles.container}>

      {/* HEADER: Titolo e tasto Esci */}
      <View style={styles.header}>
        <Text style={styles.title}>Analizzatore Fake News</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Esci</Text>
        </TouchableOpacity>
      </View>

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

      {/* Se abbiamo una spiegazione, mostriamo il box */}
      {spiegazione ? (
        <ScrollView
          style={styles.resultContainer}
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          {/* VERDETTO GIGANTE E COLORATO */}
          {verdetto ? (
            <Text style={[styles.verdettoTitle, { color: getColoreVerdetto() }]}>
              {verdetto}
            </Text>
          ) : null}

          {/* SPIEGAZIONE NORMALE STACCATA */}
          <Text style={styles.resultText}>{spiegazione}</Text>
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
    paddingTop: 50,
    backgroundColor: '#ffffff', // Aggiunto sfondo bianco per pulizia
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutBtn: {
    backgroundColor: '#f44336', // Rosso per il logout
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  input: {
    width: '100%',
    height: 120,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    color: '#000'
  },
  button: {
    backgroundColor: '#2b2d31', // Abbinato al colore del bottone di Login
    padding: 15,
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
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f4f6f8',
    width: '100%',
  },
  verdettoTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
});