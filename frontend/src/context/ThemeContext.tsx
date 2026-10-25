import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types/game';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleExcel: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('kkomantle_theme');
    if (saved === 'dark' || saved === 'excel' || saved === 'light') {
      return saved;
    }
    return 'light'; // Default: Clean Light Mode
  });

  const [previousTheme, setPreviousTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    localStorage.setItem('kkomantle_theme', theme);
    const root = document.documentElement;

    if (theme === 'excel') {
      root.classList.add('excel-mode');
      root.classList.remove('dark');
    } else if (theme === 'dark') {
      root.classList.remove('excel-mode');
      root.classList.add('dark');
      setPreviousTheme('dark');
    } else {
      root.classList.remove('excel-mode');
      root.classList.remove('dark');
      setPreviousTheme('light');
    }
  }, [theme]);

  // Global hotkeys: Alt+X or Esc 2 times for Excel stealth
  useEffect(() => {
    let escCount = 0;
    let timer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'x' || e.key === 'X' || e.key === 'ㅌ')) {
        e.preventDefault();
        toggleExcel();
      }
      if (e.key === 'Escape') {
        escCount++;
        clearTimeout(timer);
        timer = setTimeout(() => { escCount = 0; }, 400);
        if (escCount >= 2) {
          escCount = 0;
          toggleExcel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [theme, previousTheme]);

  // Toggle between Light and Dark
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Toggle Excel Stealth Mode
  const toggleExcel = () => {
    setTheme(prev => (prev === 'excel' ? previousTheme : 'excel'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, toggleExcel }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
