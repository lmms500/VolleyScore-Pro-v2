import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Synchronously get the theme from localStorage to initialize state.
// This prevents a flash of the wrong theme on initial load because React's initial state
// will match the class applied by the inline script in index.html.
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark'; // Fallback for non-browser environments.
  }
  const savedTheme = localStorage.getItem('volleyscore-theme') as Theme;
  if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
    return savedTheme;
  }
  // If no theme is saved, default to 'dark'. This could be 'system' too.
  return 'dark';
};


export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  
  // This state holds the actual applied theme ('light' or 'dark'), resolving 'system'.
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const initialTheme = getInitialTheme();
    if (initialTheme !== 'system') {
      return initialTheme;
    }
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Function to update theme, saving to state and localStorage.
  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('volleyscore-theme', newTheme);
    setThemeState(newTheme);
  };

  // Effect to apply the theme to the DOM and listen for system changes.
  useEffect(() => {
    const root = window.document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const applyCurrentTheme = () => {
      let isDark;
      if (theme === 'light') {
        isDark = false;
      } else if (theme === 'dark') {
        isDark = true;
      } else { // 'system' theme preference
        isDark = systemPrefersDark.matches;
      }

      root.classList.toggle('dark', isDark);
      setResolvedTheme(isDark ? 'dark' : 'light');
      
      const metaThemeColor = document.querySelector("meta[name=theme-color]");
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", isDark ? "#020617" : "#f1f5f9");
      }
    };

    applyCurrentTheme();

    // Set up a listener for changes in the system's color scheme preference.
    const handleSystemThemeChange = () => {
      // This listener should only trigger a change if the user has selected the 'system' theme.
      if (theme === 'system') {
        applyCurrentTheme();
      }
    };

    systemPrefersDark.addEventListener('change', handleSystemThemeChange);
    
    // Cleanup function to remove the listener when the component unmounts or the theme dependency changes.
    return () => systemPrefersDark.removeEventListener('change', handleSystemThemeChange);
  }, [theme]); // This effect re-runs whenever the user changes the theme setting.

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
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