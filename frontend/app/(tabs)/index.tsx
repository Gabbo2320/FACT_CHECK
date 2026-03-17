import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';

// Importiamo l'auth che hai configurato prima!
import { auth } from '../../firebaseConfig';
import LoginScreen from '../../components/LoginScreen';

export default function IndexScreen() {

  useEffect(() => {
    // Questo "sensore" ascolta i cambiamenti di stato (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Se c'è un utente loggato, cambia pagina e vai al Fact Check!
        router.replace('/verifica_notizia');
      }
    });

    return unsubscribe; // Pulizia del sensore
  }, []);

  return (
    <View style={styles.container}>
      {/* Mostra SOLO il bottone di Login finché non cambia pagina */}
      <LoginScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
});