import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, View, Text } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth'; // Rimosso signOut perché ora si fa nel CustomDrawer
import { useRouter } from 'expo-router';

// ⚠️ Assicurati che il percorso di Firebase sia corretto!
import { auth } from '../../firebaseConfig';

export default function HomeScreen() {
  const router = useRouter();
  const [notizia, setNotizia] = useState('');
  const [verdetto, setVerdetto] = useState('');
  const [spiegazione, setSpiegazione] = useState('');
  const [caricamento, setCaricamento] = useState(false);

  // 👇 CONTROLLO SICUREZZA (Route Protection) 👇
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // CORRETTO: Ora ti rimanda alla radice (il nuovo login)
        router.replace('/');
      }
    });
    return () => unsubscribe();
  }, []);
  // 👆 FINE CONTROLLO SICUREZZA 👆

  // 👇 LA NUOVA FUNZIONE CON IL TOKEN 👇
  const inviaAlBackend = async () => {
    if (!notizia) return;
    setCaricamento(true);
    setVerdetto('');
    setSpiegazione('');

    try {
      // 1. Recupero il token dell'utente loggato
      const token = await auth.currentUser?.getIdToken();

      // 2. Prepara gli Header in modo ordinato (il "Braccialetto VIP")
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // 3. Eseguo la chiamata passando gli Header puliti
      const response = await fetch('http://192.168.1.109:5000/check-news', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({ news: notizia }),
      });

      const data = await response.json();
      setVerdetto(data.verdetto);
      setSpiegazione(data.spiegazione);

    } catch (error) {
      setSpiegazione("Errore: il backend non risponde. Controlla che Flask sia attivo e sulla stessa rete!");
      console.error(error);
    } finally {
      setCaricamento(false);
    }
  };
  // 👆 FINE NUOVA FUNZIONE 👆

  // Colore forte per il testo e il bordo
  const getColoreVerdetto = () => {
    if (verdetto.includes('VERO')) return '#4CAF50';
    if (verdetto.includes('FALSO')) return '#d32f2f';
    return '#FF9800';
  };

  // Colore di sfondo super chiaro per il box
  const getColoreSfondoAlert = () => {
    if (verdetto.includes('VERO')) return '#edf7ed';
    if (verdetto.includes('FALSO')) return '#fdeded';
    return '#fff4e5';
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

            {/* INTESTAZIONE ALERT */}
            <View style={styles.alertHeader}>
              <Text style={styles.alertEmoji}>
                {verdetto.includes('VERO') ? '✅' : verdetto.includes('FALSO') ? '❌' : '⚠️'}
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
    paddingTop: 20, // Abbassato da 50 a 20 perché ora c'è la barra del menù sopra
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