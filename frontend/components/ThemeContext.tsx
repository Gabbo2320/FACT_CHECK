import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme(); // 'light' o 'dark' dal telefono
  const [theme, setTheme] = useState('system'); // 'system', 'light', o 'dark'

  // Calcola se deve essere scuro in base alla scelta dell'utente o al sistema
  const isDark = theme === 'system' ? systemTheme === 'dark' : theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}