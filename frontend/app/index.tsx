import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';

// ⚠️ Assicurati che il percorso di Firebase sia corretto!
import { auth } from '../firebaseConfig';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Appena l'app si apre, scolleghiamo forzatamente l'utente
    // e lo mandiamo dritto alla pagina di Login!
    signOut(auth).then(() => {
      router.replace('/login');
    }).catch(() => {
      // Se c'è un errore nel logout, andiamo comunque al login
      router.replace('/login');
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eef2f5' }}>
      <ActivityIndicator size="large" color="#2b2d31" />
    </View>
  );
}