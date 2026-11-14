import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

const STORAGE_KEY = 'oassessor.theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => { if (value === 'light' || value === 'dark' || value === 'system') setPreference(value); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? null : preference);
  }, [preference]);

  const setTheme = useCallback(async value => {
    setPreference(value);
    try { await AsyncStorage.setItem(STORAGE_KEY, value); } catch {}
  }, []);
  const toggleTheme = useCallback(() => setTheme((preference === 'dark' || (preference === 'system' && systemScheme === 'dark')) ? 'light' : 'dark'), [preference, systemScheme, setTheme]);
  const mode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(() => ({ mode, preference, colors: Colors[mode], setTheme, toggleTheme, loaded }), [mode, preference, setTheme, toggleTheme, loaded]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme deve ser usado dentro de ThemeProvider');
  return value;
}
