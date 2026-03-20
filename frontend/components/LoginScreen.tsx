import React, { useEffect } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useRouter } from 'expo-router';

// ⚠️ ATTENZIONE: Modifica questo percorso in base a dove si trova il tuo file di configurazione di Firebase!
// Ad esempio, se lo hai nella cartella principale del frontend, potrebbe essere '../firebaseConfig'
import { auth } from '../firebaseConfig';

// Questo serve a Expo per chiudere la finestra del browser dopo il login
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const router = useRouter();
  // Configura la richiesta a Google
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '714083621460-ghbt6ijj5p1tf321e30pkmdq51vknc6h.apps.googleusercontent.com',
    prompt: 'select_account'
  });

  // Questo useEffect "ascolta" quando Google ci risponde
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      // Google ci ha dato il Token! Ora lo passiamo a Firebase
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          console.log("Login completato con successo!", userCredential.user.email);
          alert(`Benvenuto ${userCredential.user.email}!`);
        })
        .catch((error) => {
          console.error("Errore Firebase:", error);
          alert("Errore durante il login");
        });
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.testo}>Accedi per salvare il tuo storico</Text>

      <Button
        title="Accedi con Google"
        disabled={!request}
        onPress={() => {
          promptAsync(); // Apre la pagina web sicura di Google
        }}
      />
    </View>
  );
}

// Un po' di stile per rendere il riquadro carino
const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8e8e8',
    borderRadius: 10,
    marginVertical: 20,
    width: '80%',
    alignSelf: 'center'
  },
  testo: {
    marginBottom: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  }
});