import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as RNuseColorScheme } from 'react-native';

const ThemeContext = createContext({
  theme: 'system',
  isDark: false,
  setTheme: (theme: string) => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState('system');
  const systemTheme = RNuseColorScheme();

  // Determina se il tema finale è scuro
  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);