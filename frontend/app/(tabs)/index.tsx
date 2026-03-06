import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  const [notizia, setNotizia] = useState(''); // Stato per il testo inserito
  const [analisi, setAnalisi] = useState(''); // Stato per la risposta dell'AI
  const [caricamento, setCaricamento] = useState(false); // Per far vedere che l'AI sta lavorando

  const inviaAlBackend = async () => {
    if (!notizia) return;
    setCaricamento(true);
    setAnalisi('');

    try {
      // NOTA: Se usi un telefono fisico, sostituisci 127.0.0.1 con l'IP del tuo PC (es. 192.168.1.15)
      const response = await fetch('http://10.176.37.91:5000/check-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news: notizia }),
      });

      const data = await response.json();
      setAnalisi(data.analisi); // Salviamo il verdetto di Gemini
    } catch (error) {
      setAnalisi("Errore: il backend non risponde. Controlla che Flask sia attivo!");
      console.error(error);
    } finally {
      setCaricamento(false);
    }
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

      {analisi ? (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Risultato:</Text>
          <Text style={styles.resultText}>{analisi}</Text>
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
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 22,
  },
});