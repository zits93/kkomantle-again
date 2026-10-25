import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeMode, ThemePreference } from '../types/game';
import { getExcelWeekTitle } from '../utils/excelTitle';

interface ThemeContextType {
  theme: ThemeMode;               // Effective active mode ('light' | 'dark' | 'excel')
  preference: ThemePreference;   // User setting ('system' | 'light' | 'dark' | 'excel')
  setTheme: (theme: ThemeMode) => void;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  toggleExcel: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Preference state: 'system' by default, or explicit override from localStorage
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem('kkomantle_theme_pref');
    if (saved === 'dark' || saved === 'light' || saved === 'excel' || saved === 'system') {
      return saved as ThemePreference;
    }
    // Backward compatibility with previous 'kkomantle_theme' key
    const legacy = localStorage.getItem('kkomantle_theme');
    if (legacy === 'dark' || legacy === 'light' || legacy === 'excel') {
      return legacy as ThemePreference;
    }
    return 'system';
  });

  // 2. Track OS dark mode in real time
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 3. Resolve effective ThemeMode
  const effectiveTheme: ThemeMode = React.useMemo(() => {
    if (preference === 'excel') return 'excel';
    if (preference === 'dark') return 'dark';
    if (preference === 'light') return 'light';
    // 'system'
    return systemIsDark ? 'dark' : 'light';
  }, [preference, systemIsDark]);

  const [previousNonExcelTheme, setPreviousNonExcelTheme] = useState<'light' | 'dark'>(() => {
    return systemIsDark ? 'dark' : 'light';
  });

  // 4. Apply DOM classes
  useEffect(() => {
    localStorage.setItem('kkomantle_theme_pref', preference);
    const root = document.documentElement;

    if (effectiveTheme === 'excel') {
      root.classList.add('excel-mode');
      root.classList.remove('dark');
      document.title = getExcelWeekTitle();
    } else if (effectiveTheme === 'dark') {
      root.classList.remove('excel-mode');
      root.classList.add('dark');
      document.title = '꼬맨틀 한번더';
      setPreviousNonExcelTheme('dark');
    } else {
      root.classList.remove('excel-mode');
      root.classList.remove('dark');
      document.title = '꼬맨틀 한번더';
      setPreviousNonExcelTheme('light');
    }
  }, [effectiveTheme, preference]);

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
  }, [effectiveTheme, previousNonExcelTheme]);

  // Toggle between Light and Dark (Explicit user override)
  const toggleTheme = useCallback(() => {
    setPreference(prev => {
      const currentActive = prev === 'system' ? (systemIsDark ? 'dark' : 'light') : prev;
      return currentActive === 'dark' ? 'light' : 'dark';
    });
  }, [systemIsDark]);

  // Toggle Excel Stealth Mode
  const toggleExcel = useCallback(() => {
    setPreference(prev => {
      if (prev === 'excel') {
        return previousNonExcelTheme;
      }
      return 'excel';
    });
  }, [previousNonExcelTheme]);

  const setTheme = useCallback((theme: ThemeMode) => {
    setPreference(theme);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: effectiveTheme,
        preference,
        setTheme,
        setPreference,
        toggleTheme,
        toggleExcel,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
