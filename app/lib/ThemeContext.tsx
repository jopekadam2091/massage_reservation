'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { supabase } from './supabase';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const initTheme = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userLoggedIn = !!session?.user;
      setIsLoggedIn(userLoggedIn);

      if (!userLoggedIn) {
        // Keď nie si prihlásený, bude len darkmode
        setThemeState('dark');
        document.documentElement.classList.add('dark');
      } else {
        const stored = localStorage.getItem('theme') as Theme | null;
        const initial = stored || 'dark';
        setThemeState(initial);
        if (initial === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    initTheme();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const userLoggedIn = !!session?.user;
      setIsLoggedIn(userLoggedIn);

      if (!userLoggedIn) {
        setThemeState('dark');
        document.documentElement.classList.add('dark');
      } else {
        const stored = localStorage.getItem('theme') as Theme | null;
        const initial = stored || 'dark';
        setThemeState(initial);
        if (initial === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setTheme = (next: Theme) => {
    if (!isLoggedIn) {
      // Pre neprihlásených je povolený výhradne darkmode
      setThemeState('dark');
      document.documentElement.classList.add('dark');
      return;
    }
    setThemeState(next);
    localStorage.setItem('theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    if (!isLoggedIn) {
      return;
    }
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme musí byť použité vnútri ThemeProvider');
  return ctx;
}