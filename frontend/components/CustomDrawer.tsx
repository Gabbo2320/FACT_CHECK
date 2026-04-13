import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, LayoutAnimation, Platform, UIManager } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '../firebaseConfig';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CustomDrawer(props: any) {
  const router = useRouter();
  const user = auth.currentUser;

  // --- LOGICA TEMA ---
  const systemTheme = useColorScheme();
  const [userTheme, setUserTheme] = useState('system');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const activeTheme = userTheme === 'system' ? systemTheme : userTheme;
  const isDark = activeTheme === 'dark';

  const colors = {
    bg: isDark ? '#121212' : '#ffffff',
    sectionBg: isDark ? '#1e1e1e' : '#f8f9fa',
    borderColor: isDark ? '#333333' : '#eeeeee',
    textColor: isDark ? '#ffffff' : '#1a1a1a',
    subTextColor: isDark ? '#aaaaaa' : '#666666',
    hover: isDark ? '#2c2c2c' : '#f1f3f4',
  };

  const displayName = user?.displayName || user?.email || 'Utente Sconosciuto';

  const toggleThemeMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsThemeMenuOpen(!isThemeMenuOpen);
  };

  const getInitials = (name: string) => {
    if (name.includes('@')) return name.substring(0, 2).toUpperCase();
    const words = name.split(' ');
    if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}>

      {/* 🔝 INTESTAZIONE */}
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <Text style={[styles.headerTitle, { color: colors.textColor }]}>FactCheck AI</Text>
        <Text style={[styles.headerSubtitle, { color: colors.subTextColor }]}>Il tuo assistente antibufale</Text>
      </View>

      {/* SPAZIO CENTRALE VUOTO */}
      <View style={{ flex: 1 }} />

      {/* 👤 FOOTER: Tema + Profilo + Logout */}
      <View style={[styles.footer, { borderTopColor: colors.borderColor }]}>

        {/* 🎨 NUOVA SEZIONE TEMA STILE GOOGLE */}
        <View style={styles.themeContainer}>
          <TouchableOpacity
            style={[styles.menuItem, isThemeMenuOpen && { backgroundColor: colors.hover }]}
            onPress={toggleThemeMenu}
          >
            <View style={styles.menuLeft}>
              <Text style={{ fontSize: 18 }}>🌓</Text>
              <Text style={[styles.menuText, { color: colors.textColor }]}>Tema</Text>
            </View>
            <Text style={{ color: colors.textColor, opacity: 0.5, fontSize: 10 }}>
              {isThemeMenuOpen ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {isThemeMenuOpen && (
            <View style={[styles.subMenu, { backgroundColor: colors.sectionBg, borderColor: colors.borderColor }]}>
              {[
                { id: 'system', label: 'Sistema', icon: '⚙️' },
                { id: 'light', label: 'Chiaro', icon: '☀️' },
                { id: 'dark', label: 'Scuro', icon: '🌙' }
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.subMenuItem}
                  onPress={() => { setUserTheme(opt.id); setIsThemeMenuOpen(false); }}
                >
                  <Text style={[styles.subMenuText, { color: colors.textColor }]}>{opt.icon} {opt.label}</Text>
                  {userTheme === opt.id && <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 👤 PROFILO UTENTE (Ripristinato) */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.userName, { color: colors.textColor }]} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
        </View>

        {/* 🚪 LOGOUT (Ripristinato) */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => signOut(auth).then(() => router.replace('/'))}
        >
          <Text style={styles.logoutText}>Disconnettiti</Text>
        </TouchableOpacity>
      </View>

    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, marginTop: 10, borderBottomWidth: 1, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  headerSubtitle: { fontSize: 13, marginTop: 4 },

  footer: { padding: 20, borderTopWidth: 1 },

  // Stili Tema Google
  themeContainer: { marginBottom: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontSize: 15, fontWeight: '400' },
  subMenu: { marginTop: 5, borderRadius: 12, borderWidth: 1, paddingVertical: 4, marginHorizontal: 5, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  subMenuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 15 },
  subMenuText: { fontSize: 14 },

  // Stili Profilo
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  textContainer: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold' },

  logoutButton: { backgroundColor: '#d32f2f', padding: 14, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
});