import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';

// ⚠️ Assicurati che il percorso di Firebase sia corretto!
import { auth } from '../firebaseConfig';

export default function CustomDrawer(props: any) {
  const router = useRouter();

  // Recuperiamo l'utente loggato da Firebase
  const user = auth.currentUser;

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Al logout, riportiamo l'utente alla schermata di login (presumo sia la root '/')
        router.replace('/');
      })
      .catch((error) => {
        alert("Errore durante il logout: " + error.message);
      });
  };

  return (
    <View style={styles.container}>
      {/* PARTE ALTA: Le voci del menù (Home, Impostazioni, ecc.) */}
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* PARTE BASSA: Il Footer con Account e Logout */}
      <View style={styles.footer}>
        <Text style={styles.emailText}>
          {user?.email ? user.email : "Utente non identificato"}
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Esci dall'account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e8',
    backgroundColor: '#fafafa',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#DB4437', // Rosso stile Google/Logout
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  }
});