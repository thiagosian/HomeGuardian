import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import classicTheme from '../themes/classic';
import modernTheme from '../themes/modern';

// Available themes
const THEMES = {
  classic: classicTheme,
  modern: modernTheme,
};

const THEME_STORAGE_KEY = 'homeguardian-theme-preference';

// Create context
const ThemeContext = createContext({
  currentTheme: 'classic',
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
 * ThemeProvider component that wraps the app and provides theme switching functionality
 */
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'classic'
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      return savedTheme && THEMES[savedTheme] ? savedTheme : 'classic';
    } catch (error) {
      console.error('[ThemeProvider] Error loading theme from localStorage:', error);
      return 'classic';
    }
  });

  // Persist theme preference to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
      console.log('[ThemeProvider] Theme saved to localStorage:', currentTheme);
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

  // Get the actual MUI theme object
  const muiTheme = THEMES[currentTheme];

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
