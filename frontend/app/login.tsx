import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { useRouter } from 'expo-router';

// ⚠️ Assicurati che il percorso di Firebase sia corretto!
import { auth } from '../firebaseConfig';

// Necessario per Expo Auth Session
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Questa variabile decide se stiamo facendo Login (true) o Registrazione (false)
  const [isLogin, setIsLogin] = useState(true);

  // --- CONFIGURAZIONE GOOGLE ---
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '714083621460-ghbt6ijj5p1tf321e30pkmdq51vknc6h.apps.googleusercontent.com',
    prompt: 'select_account'
  });

  // --- LISTENER GOOGLE ---
  useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true); // Mostriamo il caricamento mentre Firebase verifica
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then(() => {
          setLoading(false);
          router.replace('/home'); // 🎉 Login riuscito, andiamo alla home
        })
        .catch((error) => {
          setLoading(false);
          alert("Errore Google: " + error.message);
        });
    }
  }, [response]);

  // --- FUNZIONE EMAIL/PASSWORD (LOGIN E REGISTRAZIONE) ---
  const handleAuthentication = () => {
    if (!email || !password) {
      alert("Per favore, inserisci email e password.");
      return;
    }

    setLoading(true);

    if (isLogin) {
      // LOGIN
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          setLoading(false);
          router.replace('/home');
        })
        .catch((error) => {
          setLoading(false);
          alert("Errore Login: " + error.message);
        });
    } else {
      // REGISTRAZIONE
      createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
          setLoading(false);
          alert("Account creato con successo!");
          router.replace('/home');
        })
        .catch((error) => {
          setLoading(false);
          alert("Errore Registrazione: " + error.message);
        });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* TITOLO DINAMICO */}
        <Text style={styles.title}>FactCheck</Text>
        <Text style={styles.subtitle}>
          {isLogin ? "Accedi per connetterti con la piattaforma" : "Crea un nuovo account per iniziare"}
        </Text>

        <Text style={styles.label}>Indirizzo Email</Text>
        <TextInput
          style={styles.input}
          placeholder="cognome.nome@esempio.it"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* BOTTONE PRINCIPALE (Accedi o Registrati) */}
        <TouchableOpacity style={styles.button} onPress={handleAuthentication} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? "Accedi" : "Registrati"}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>oppure continua con</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* BOTTONE GOOGLE (Richiama promptAsync come prima) */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
          disabled={!request || loading}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleButtonText}>Accedi con Google</Text>
        </TouchableOpacity>

        {/* PULSANTE CAMBIO MODALITÀ (Login <-> Register) */}
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchModeBtn}>
          <Text style={styles.switchModeText}>
            {isLogin
              ? "Non hai un account? Clicca qui per registrarti"
              : "Hai già un account? Clicca qui per accedere"}
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff2f5',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 15,
    width: '100%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e1e5e8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 15,
    color: '#333',
  },
  button: {
    backgroundColor: '#2b2d31',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e1e5e8',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#888',
    fontSize: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
  },
  googleIcon: {
    color: '#DB4437',
    fontWeight: '900',
    fontSize: 18,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  switchModeBtn: {
    alignItems: 'center',
  },
  switchModeText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 13,
    textDecorationLine: 'underline',
  }
});