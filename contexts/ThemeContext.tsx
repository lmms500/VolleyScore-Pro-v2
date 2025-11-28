import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark'; // Fallback for non-browser environments.
  }
  const savedTheme = localStorage.getItem('volleyscore-theme');
  // Default to dark unless explicitly set to light.
  return savedTheme === 'light' ? 'light' : 'dark';
};


export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('volleyscore-theme', newTheme);
    setThemeState(newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    
    root.classList.toggle('dark', isDark);
    
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", isDark ? "#020617" : "#f1f5f9");
    }
  }, [theme]);

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