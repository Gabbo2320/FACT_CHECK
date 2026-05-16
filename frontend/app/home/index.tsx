import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, View, Text, Keyboard } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';

import { auth } from '../../firebaseConfig';
import { useTheme } from '../../components/ThemeContext';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  // 🕒 LOGICA DI RECUPERO DALLA CRONOLOGIA CORRETTA
  useEffect(() => {
    if (params.prevNews && params.prevAnalysis) {
      setNotizia(params.prevNews as string);

      const analisiCompleta = params.prevAnalysis as string;

      if (analisiCompleta.includes(' - ')) {
        const [v, ...rest] = analisiCompleta.split(' - ');
        setVerdetto(v.trim());
        setSpiegazione(rest.join(' - ').trim());
      } else {
        setVerdetto('ANALISI');
        setSpiegazione(analisiCompleta);
      }
      router.setParams({ prevNews: undefined, prevAnalysis: undefined });
    }
  }, [params.prevNews, params.prevAnalysis]);

  const [notizia, setNotizia] = useState('');
  const [verdetto, setVerdetto] = useState('');
  const [spiegazione, setSpiegazione] = useState('');

  // STATO PER DISABILITARE LA UI
  const [caricamento, setCaricamento] = useState(false);

  // RIFERIMENTO IMMEDIATO PER BLOCCARE LO SPAM DI CLICK
  const stoCaricando = useRef(false);

  const { isDark } = useTheme();

  // 🎨 PALETTE COLORI
  const colors = {
    bg: isDark ? '#121212' : '#f4f4f5',
    inputBg: isDark ? '#1e1e1e' : '#ffffff',
    inputBorder: isDark ? '#333333' : '#e4e4e7',
    text: isDark ? '#ffffff' : '#18181b',
    placeholder: isDark ? '#888888' : '#a1a1aa',
    buttonBg: isDark ? '#2563eb' : '#007AFF',
    buttonText: '#ffffff',
    alertText: isDark ? '#e0e0e0' : '#222222',
    alertFooter: isDark ? '#aaaaaa' : '#777777',
    alertBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    headerBg: isDark ? '#121212' : '#ffffff',
    headerText: isDark ? '#ffffff' : '#000000',
  };

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
    // 1. BLOCCO IMMEDIATO: Se il campo è vuoto o stiamo già caricando, interrompi subito
    if (!notizia || stoCaricando.current) return;

    // 2. CHIUDI LA TASTIERA: Previene tocchi accidentali dovuti allo spostamento dell'interfaccia
    Keyboard.dismiss();

    // 3. ATTIVA I BLOCCHI: Blocchiamo sia la logica (Ref) che la grafica (State)
    stoCaricando.current = true;
    setCaricamento(true);

    // Resetta navigazione e stati precedenti
    router.setParams({ prevNews: undefined, prevAnalysis: undefined });
    setVerdetto('');
    setSpiegazione('');

    try {
      const token = await auth.currentUser?.getIdToken();

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch('https://kratos.vps.webdock.cloud/api/check-news', {
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
      // 4. SBLOCCO FINALE: Riattiviamo il bottone solo a operazione totalmente conclusa
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
          // La disabilitazione grafica è gestita da "caricamento"
          style={[styles.button, { backgroundColor: caricamento ? colors.placeholder : colors.buttonBg }]}
          onPress={inviaAlBackend}
          disabled={caricamento}
        >
          {caricamento ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Verifica con Gemini</Text>
          )}
        </TouchableOpacity>

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
    paddingTop: 40,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    flex: 1,
  },
  input: {
    width: '100%',
    height: 140,
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
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
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  alertText: {
    fontSize: 16,
    lineHeight: 26,
  },
  alertFooter: {
    marginTop: 20,
    paddingTop: 12,
    fontSize: 13,
    fontStyle: 'italic',
    borderTopWidth: 1,
  },
});