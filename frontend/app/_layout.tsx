import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Importa il Provider che hai creato nella cartella components
import { ThemeProvider } from '../components/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}