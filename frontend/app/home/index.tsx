import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, View, Text } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useNavigation } from 'expo-router';

import { auth } from '../../firebaseConfig';
import { useTheme } from '../../components/ThemeContext';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [notizia, setNotizia] = useState('');
  const [verdetto, setVerdetto] = useState('');
  const [spiegazione, setSpiegazione] = useState('');
  const [caricamento, setCaricamento] = useState(false);

  const { isDark } = useTheme();

  // 🎨 PALETTE COLORI LIVELLO "PRO"
  const colors = {
    // Sfondo principale: quasi nero in Dark, grigio chiarissimo/pulito in Light
    bg: isDark ? '#121212' : '#f4f4f5',
    // Campo di testo: leggermente più chiaro in Dark, bianco puro in Light per far risaltare l'area di scrittura
    inputBg: isDark ? '#1e1e1e' : '#ffffff',
    inputBorder: isDark ? '#333333' : '#e4e4e7',
    text: isDark ? '#ffffff' : '#18181b',
    placeholder: isDark ? '#888888' : '#a1a1aa',

    // 👇 Il tocco "Brand": un blu acceso (trust/tech) per il bottone principale, visibile su entrambi i temi
    buttonBg: isDark ? '#2563eb' : '#007AFF',
    buttonText: '#ffffff',

    alertText: isDark ? '#e0e0e0' : '#222222',
    alertFooter: isDark ? '#aaaaaa' : '#777777',
    alertBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',

    headerBg: isDark ? '#121212' : '#ffffff', // Allineato al bg
    headerText: isDark ? '#ffffff' : '#000000',
  };

  const stoCaricando = useRef(false);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.headerBg,
        shadowColor: 'transparent',
        elevation: 0,
      },
      headerTintColor: colors.headerText,
    });
  }, [isDark, navigation, colors]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/');
      }
    });
    return () => unsubscribe();
  }, []);

  const inviaAlBackend = async () => {
    if (!notizia || stoCaricando.current) return;

    stoCaricando.current = true;
    setCaricamento(true);
    setVerdetto('');
    setSpiegazione('');

    try {
      const token = await auth.currentUser?.getIdToken();

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch('https://kratos.vps.webdock.cloud/check-news', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({ news: notizia }),
      });

      const data = await response.json();

      if (data.status === 'error') {
        setVerdetto('ERRORE DI SISTEMA');
        setSpiegazione(data.message);
      } else {
        setVerdetto(data.verdetto);
        setSpiegazione(data.spiegazione);
      }

    } catch (error) {
      setVerdetto('ERRORE DI CONNESSIONE');
      setSpiegazione("Il server non risponde. Controlla la connessione a internet o se il backend è attivo.");
      console.error(error);
    } finally {
      stoCaricando.current = false;
      setCaricamento(false);
    }
  };

  const getColoreVerdetto = () => {
    const v = verdetto || '';
    if (v.includes('VERO')) return isDark ? '#66bb6a' : '#4CAF50';
    if (v.includes('FALSO')) return isDark ? '#ef5350' : '#d32f2f';
    return isDark ? '#ffa726' : '#FF9800';
  };

  const getColoreSfondoAlert = () => {
    const v = verdetto || '';
    if (v.includes('VERO')) return isDark ? '#1b3320' : '#edf7ed';
    if (v.includes('FALSO')) return isDark ? '#3b1c1c' : '#fdeded';
    return isDark ? '#332a18' : '#fff4e5';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>

      {/* 👇 AGGIUNTO WRAPPER CENTRALE: limita la larghezza su PC stile ChatGPT 👇 */}
      <View style={styles.contentWrapper}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text
            }
          ]}
          placeholder="Incolla qui la notizia da verificare..."
          placeholderTextColor={colors.placeholder}
          value={notizia}
          onChangeText={setNotizia}
          multiline
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonBg }]}
          onPress={inviaAlBackend}
          disabled={caricamento}
        >
          {caricamento ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Verifica con Gemini</Text>
          )}
        </TouchableOpacity>

        {/* --- SEZIONE RISULTATO --- */}
        {spiegazione ? (
          <ScrollView
            style={styles.resultContainer}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={[
              styles.alertBox,
              {
                backgroundColor: getColoreSfondoAlert(),
                borderLeftColor: getColoreVerdetto()
              }
            ]}>

              <View style={styles.alertHeader}>
                <Text style={styles.alertEmoji}>
                  {(verdetto || '').includes('VERO') ? '✅' : (verdetto || '').includes('FALSO') ? '❌' : '⚠️'}
                </Text>
                <Text style={[styles.alertTitle, { color: getColoreVerdetto() }]}>
                  {verdetto}
                </Text>
              </View>

              <Text style={[styles.alertText, { color: colors.alertText }]}>{spiegazione}</Text>

              <Text style={[styles.alertFooter, { color: colors.alertFooter, borderTopColor: colors.alertBorder }]}>
                Analisi di Gemini • Verifica sempre su fonti ufficiali
              </Text>

            </View>
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40, // Un po' più di respiro in alto
  },
  // 👇 IL SEGRETO PER IL LAYOUT DESKTOP PERFETTO 👇
  contentWrapper: {
    width: '100%',
    maxWidth: 800, // Non si allargherà mai oltre gli 800px
    alignSelf: 'center', // Rimane perfettamente al centro
    flex: 1,
  },
  input: {
    width: '100%',
    height: 140, // Leggermente più alto per incollare testi lunghi
    borderWidth: 1,
    borderRadius: 12, // Angoli leggermente più morbidi
    padding: 18,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
    // Ombreggiatura leggerissima per dare tridimensionalità
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    // Ombra al bottone per farlo sembrare cliccabile
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5, // Leggermente spaziato per eleganza
  },
  resultContainer: {
    flex: 1,
    marginTop: 30,
    width: '100%',
  },
  alertBox: {
    width: '100%',
    padding: 24,
    borderRadius: 12,
    borderLeftWidth: 8,
    marginBottom: 10,
    // Ombra anche ai risultati
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '800', // Più marcato
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  alertText: {
    fontSize: 16,
    lineHeight: 26, // Più interlinea per leggibilità
  },
  alertFooter: {
    marginTop: 20,
    paddingTop: 12,
    fontSize: 13,
    fontStyle: 'italic',
    borderTopWidth: 1,
  },
});