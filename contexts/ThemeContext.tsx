import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Lógica de Inicialização Única
    const savedTheme = localStorage.getItem('appTheme') as Theme;

    let initialTheme: Theme;

    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        // Se já existe preferência salva, usa ela
        initialTheme = savedTheme;
    } else {
        // Primeiro uso: Detecta sistema UMA VEZ e salva como preferência manual
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        initialTheme = systemPrefersDark ? 'dark' : 'light';
        localStorage.setItem('appTheme', initialTheme);
    }

    // Aplica o tema inicial
    setThemeState(initialTheme);
    applyThemeToDOM(initialTheme);
  }, []);
  
  const applyThemeToDOM = (t: Theme) => {
      const root = window.document.documentElement;
      const isDark = t === 'dark';
      
      root.classList.remove('light', 'dark');
      root.classList.add(t);

      const metaThemeColor = document.querySelector("meta[name=theme-color]");
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", isDark ? "#020617" : "#f1f5f9");
      }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('appTheme', newTheme);
    applyThemeToDOM(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};