import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// Available themes (now just 'light' and 'dark' for Tailwind)
const THEMES = {
  classic: 'light',
  modern: 'dark',
};

const THEME_STORAGE_KEY = 'homeguardian-theme-preference';

// Create context
const ThemeContext = createContext({
  currentTheme: 'modern',
  setTheme: () => {},
  availableThemes: Object.keys(THEMES),
});

/**
 * Custom hook to use the theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * ThemeProvider component for Tailwind CSS dark mode
 */
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'modern' (dark)
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      return savedTheme && THEMES[savedTheme] ? savedTheme : 'modern';
    } catch (error) {
      console.error('[ThemeProvider] Error loading theme from localStorage:', error);
      return 'modern';
    }
  });

  // Apply theme to document root
  useEffect(() => {
    const root = window.document.documentElement;
    const tailwindTheme = THEMES[currentTheme]; // 'light' or 'dark'

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Add the current theme class
    if (tailwindTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    // Persist to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
      console.log('[ThemeProvider] Theme applied:', currentTheme, '→', tailwindTheme);
    } catch (error) {
      console.error('[ThemeProvider] Error saving theme to localStorage:', error);
    }
  }, [currentTheme]);

  // Function to change the theme
  const setTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
      console.log('[ThemeProvider] Theme changed to:', themeName);
    } else {
      console.warn('[ThemeProvider] Invalid theme name:', themeName);
    }
  };

  // Memoize the context value to avoid unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      currentTheme,
      setTheme,
      availableThemes: Object.keys(THEMES),
    }),
    [currentTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
