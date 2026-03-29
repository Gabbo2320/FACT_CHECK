import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

// ⚠️ Assicurati che il percorso di Firebase sia corretto
import { auth } from '../firebaseConfig';

export default function CustomDrawer(props: any) {
  const router = useRouter();
  const user = auth.currentUser;

  const displayName = user?.displayName || user?.email || 'Utente Sconosciuto';

  const getInitials = (name: string) => {
    if (name.includes('@')) return name.substring(0, 2).toUpperCase();
    const words = name.split(' ');
    if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.replace('/');
    }).catch((error) => console.error("Errore logout:", error));
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>

      {/* 🔝 INTESTAZIONE */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FactCheck AI</Text>
        <Text style={styles.headerSubtitle}>Il tuo assistente antibufale</Text>
      </View>

      {/* 🚀 SPAZIO VUOTO (Spinge il profilo tutto in basso) */}
      <View style={styles.spacer} />

      {/* 👤 PARTE IN BASSO: Profilo Utente e Tasto Disconnettiti */}
      <View style={styles.footer}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
          </View>
        </View>

        {/* Nuovo Bottone Disconnettiti - Stile Professionale */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Disconnettiti</Text>
        </TouchableOpacity>
      </View>

    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  spacer: {
    flex: 1, // Rimesso lo spacer per spingere tutto in basso
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textContainer: {
    marginLeft: 15,
    flex: 1,
    justifyContent: 'center', // Centra verticalmente il nome ora che manca il sottotitolo
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#d32f2f', // Rosso forte aziendale
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff', // Testo bianco per contrastare col rosso
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});