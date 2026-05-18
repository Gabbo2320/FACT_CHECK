import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, ScrollView, ActivityIndicator } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '../firebaseConfig';

// 🎨 IMPORT DEL CONTEXT GLOBALE
import { useTheme } from './ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CustomDrawer(props: any) {
  const router = useRouter();
  const user = auth.currentUser;

  // 🎨 LOGICA TEMA GLOBALE
  const { isDark, theme, setTheme } = useTheme();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // 🕒 STATI PER LA CRONOLOGIA
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const colors = {
    bg: isDark ? '#121212' : '#ffffff',
    sectionBg: isDark ? '#1e1e1e' : '#f8f9fa',
    borderColor: isDark ? '#333333' : '#eeeeee',
    textColor: isDark ? '#ffffff' : '#1a1a1a',
    subTextColor: isDark ? '#aaaaaa' : '#666666',
    hover: isDark ? '#2c2c2c' : '#f1f3f4',
  };

  const displayName = user?.displayName || user?.email || 'Utente Sconosciuto';

  // 🚀 RECUPERO CRONOLOGIA DAL BACKEND
  const fetchHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();

      const response = await fetch('https://kratos.vps.webdock.cloud/api/get-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Errore nel recupero cronologia:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchHistory();
    }
  }, [user?.uid]);

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
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}
    >

      {/* 🔝 INTESTAZIONE */}
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <Text style={[styles.headerTitle, { color: colors.textColor }]}>FactCheck AI</Text>
        <Text style={[styles.headerSubtitle, { color: colors.subTextColor }]}>Il tuo assistente antibufale</Text>
      </View>

      {/* 🕒 SEZIONE CRONOLOGIA */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: colors.subTextColor }]}>ANALISI RECENTI</Text>
          <TouchableOpacity onPress={fetchHistory}>
            <Text style={{ fontSize: 12, color: '#007AFF', fontWeight: '600' }}>Aggiorna</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 20 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
            {history.length > 0 ? (
              history.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.historyItem, { borderBottomColor: colors.borderColor }]}
                  onPress={() => {
                    // 💡 Leggiamo direttamente i dati puliti inviati dal nuovo backend
                    const verdettoInviato = item.verdetto || "INCERTO";
                    const spiegazioneInviata = item.spiegazione || item.analisi || "";

                    router.push({
                      pathname: '/home',
                      params: {
                        prevNews: item.testo,
                        prevVerdict: verdettoInviato,
                        prevExplanation: spiegazioneInviata
                      }
                    });

                    props.navigation.closeDrawer();
                  }}
                >
                  <Text numberOfLines={1} style={[styles.historyText, { color: colors.textColor }]}>
                    {item.testo}
                  </Text>
                  <Text style={styles.historyDate}>{item.data}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.subTextColor }]}>Nessuna analisi effettuata.</Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* 👤 FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderColor }]}>

        {/* 🎨 TEMA */}
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
                  onPress={() => { setTheme(opt.id); setIsThemeMenuOpen(false); }}
                >
                  <Text style={[styles.subMenuText, { color: colors.textColor }]}>{opt.icon} {opt.label}</Text>
                  {theme === opt.id && <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 👤 PROFILO */}
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

        {/* 🚪 LOGOUT */}
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

  historySection: { flex: 1, paddingHorizontal: 20, marginTop: 20, minHeight: 200 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  historyTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  historyItem: { paddingVertical: 12, borderBottomWidth: 1 },
  historyText: { fontSize: 14, fontWeight: '500' },
  historyDate: { fontSize: 11, color: '#999', marginTop: 4 },
  emptyText: { fontSize: 13, fontStyle: 'italic', marginTop: 10, textAlign: 'center' },

  footer: { padding: 20, borderTopWidth: 1 },

  themeContainer: { marginBottom: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontSize: 15, fontWeight: '400' },
  subMenu: { marginTop: 5, borderRadius: 12, borderWidth: 1, paddingVertical: 4, marginHorizontal: 5, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  subMenuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 15 },
  subMenuText: { fontSize: 14 },

  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  textContainer: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold' },

  logoutButton: { backgroundColor: '#d32f2f', padding: 14, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
});