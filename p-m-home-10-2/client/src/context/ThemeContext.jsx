import { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, setTheme } from '../store/themeStore.js';

const ThemeContext = createContext(null);

/**
 * Theme provider: manages theme state and provides reactive theme updates
 */
export function ThemeProvider({ children }) {
  // Initialize with light theme for first-time users
  const [theme, setThemeState] = useState(() => {
    const stored = getTheme();
    return stored || 'light';
  });

  // Apply theme on mount and when theme changes
  useEffect(() => {
    // setTheme already calls applyTheme internally
    setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'));
  };

  const changeTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

