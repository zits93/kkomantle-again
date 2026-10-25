import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types/game';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('kkomantle_theme');
    return (saved as ThemeMode) || 'liquid-glass';
  });

  useEffect(() => {
    localStorage.setItem('kkomantle_theme', theme);
    const root = document.documentElement;
    if (theme === 'excel') {
      root.classList.add('excel-mode');
      root.classList.remove('dark');
    } else {
      root.classList.remove('excel-mode');
      root.classList.add('dark');
    }
  }, [theme]);

  // Global hotkey: Alt + X or double Escape to stealth switch to Excel!
  useEffect(() => {
    let escCount = 0;
    let timer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'x' || e.key === 'X' || e.key === 'ㅌ')) {
        e.preventDefault();
        setTheme(prev => (prev === 'liquid-glass' ? 'excel' : 'liquid-glass'));
      }
      if (e.key === 'Escape') {
        escCount++;
        clearTimeout(timer);
        timer = setTimeout(() => { escCount = 0; }, 400);
        if (escCount >= 2) {
          escCount = 0;
          setTheme(prev => (prev === 'liquid-glass' ? 'excel' : 'liquid-glass'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'liquid-glass' ? 'excel' : 'liquid-glass'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
