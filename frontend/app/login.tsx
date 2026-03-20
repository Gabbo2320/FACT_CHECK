import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';

// ⚠️ Assicurati che il percorso di Firebase sia corretto!
import { auth } from '../firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Configurazione Google
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '714083621460-ghbt6ijj5p1tf321e30pkmdq51vknc6h.apps.googleusercontent.com',
    prompt: 'select_account'
  });

  // Listener per Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => {
          // 🎉 SE IL LOGIN GOOGLE FUNZIONA, VAI ALLA HOME
          router.replace('/home');
        })
        .catch((error) => alert("Errore Google: " + error.message));
    }
  }, [response]);

  // Funzione per il login classico Email/Password
  const handleEmailLogin = () => {
    if (!email || !password) {
      alert("Inserisci sia email che password!");
      return;
    }
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        // 🎉 SE IL LOGIN EMAIL FUNZIONA, VAI ALLA HOME
        router.replace('/home');
      })
      .catch((error) => {
        alert("Errore: " + error.message);
      });
  };

  return (
    <View style={styles.sfondo}>
      <View style={styles.card}>

        {/* Titolo e Sottotitolo */}
        <Text style={styles.titolo}>FactCheck</Text>
        <Text style={styles.sottotitolo}>Accedi per connetterti con la piattaforma</Text>

        {/* Sezione Email */}
        <Text style={styles.etichetta}>Indirizzo Email</Text>
        <TextInput
          style={styles.input}
          placeholder="cognome.nome@esempio.it"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Sezione Password */}
        <Text style={styles.etichetta}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Bottone Accedi (Scuro) */}
        <TouchableOpacity style={styles.bottonePrimario} onPress={handleEmailLogin}>
          <Text style={styles.testoBottonePrimario}>Accedi</Text>
        </TouchableOpacity>

        {/* Separatore */}
        <View style={styles.contenitoreSeparatore}>
          <View style={styles.linea} />
          <Text style={styles.testoSeparatore}>oppure continua con</Text>
          <View style={styles.linea} />
        </View>

        {/* Bottone Google */}
        <TouchableOpacity
          style={styles.bottoneGoogle}
          disabled={!request}
          onPress={() => promptAsync()}
        >
          <Text style={styles.iconaGoogle}>G</Text>
          <Text style={styles.testoBottoneGoogle}>Accedi con Google</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sfondo: {
    flex: 1,
    backgroundColor: '#eef2f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  titolo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  sottotitolo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  etichetta: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e8',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
  },
  bottonePrimario: {
    backgroundColor: '#2b2d31',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  testoBottonePrimario: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contenitoreSeparatore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: '#e1e5e8',
  },
  testoSeparatore: {
    marginHorizontal: 15,
    color: '#888',
    fontSize: 13,
  },
  bottoneGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e5e8',
    paddingVertical: 14,
    borderRadius: 12,
  },
  iconaGoogle: {
    color: '#DB4437',
    fontWeight: '900',
    fontSize: 18,
    marginRight: 10,
  },
  testoBottoneGoogle: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  }
});