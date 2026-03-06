import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  const [notizia, setNotizia] = useState('');
  const [verdetto, setVerdetto] = useState(''); // Stato per VERO/FALSO
  const [spiegazione, setSpiegazione] = useState(''); // Stato per la descrizione
  const [caricamento, setCaricamento] = useState(false);

  const inviaAlBackend = async () => {
    if (!notizia) return;
    setCaricamento(true);
    setVerdetto('');
    setSpiegazione('');

    try {
      const response = await fetch('http://192.168.1.109:5000/check-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news: notizia }),
      });

      const data = await response.json();
      setVerdetto(data.verdetto);       // Gemini ci passa la parola VERO o FALSO
      setSpiegazione(data.spiegazione); // Gemini ci passa la spiegazione

    } catch (error) {
      setSpiegazione("Errore: il backend non risponde. Controlla che Flask sia attivo!");
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
      <Text style={styles.title}>Analizzatore Fake News</Text>

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
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
    backgroundColor: '#2196F3',
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  // STILE PER IL NUOVO VERDETTO GIGANTE
  verdettoTitle: {
    fontSize: 32,            // Più grande
    fontWeight: '900',       // Molto marcato
    textAlign: 'center',     // Centrato
    marginBottom: 20,        // Staccato dalla spiegazione
    textTransform: 'uppercase', // Tutto maiuscolo
    letterSpacing: 2,        // Spazio tra le lettere
  },
  resultText: {
    fontSize: 16,
    lineHeight: 22,
  },
});