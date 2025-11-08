import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const THEME_STORAGE_KEY = 'homeguardian-theme';

// Available themes: classic (light/dark) and new (light/dark)
const VALID_THEMES = ['classic-light', 'classic-dark', 'new-light', 'new-dark'];

/**
 * Convert legacy localStorage values to new theme names
 * classic → classic-light
 * modern → classic-dark
 */
const migrateOldTheme = (oldValue) => {
  if (oldValue === 'classic') return 'classic-light';
  if (oldValue === 'modern') return 'classic-dark';
  return oldValue;
};

/**
 * Determine if a theme is dark
 */
const isDarkTheme = (theme) => theme.endsWith('-dark');

/**
 * Determine if a theme is classic
 */
const isClassicTheme = (theme) => theme.startsWith('classic-');

/**
 * Determine if a theme is new
 */
const isNewTheme = (theme) => theme.startsWith('new-');

// Create context
const ThemeContext = createContext({
  theme: 'classic-light',
  setTheme: () => {},
  isDark: false,
  isClassicTheme: true,
  isNewTheme: false,
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
 * ThemeProvider component - simplified without MUI
 */
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'classic-light'
  const [theme, setCurrentTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);

      // If nothing saved, check for old theme format
      if (!saved) {
        const oldTheme = localStorage.getItem('homeguardian-theme-preference');
        if (oldTheme) {
          const migrated = migrateOldTheme(oldTheme);
          return VALID_THEMES.includes(migrated) ? migrated : 'classic-light';
        }
        return 'classic-light';
      }

      // Check if saved value is valid, otherwise migrate
      if (VALID_THEMES.includes(saved)) {
        return saved;
      }

      // Try to migrate old format
      const migrated = migrateOldTheme(saved);
      return VALID_THEMES.includes(migrated) ? migrated : 'classic-light';
    } catch (error) {
      console.error('[ThemeProvider] Error loading theme from localStorage:', error);
      return 'classic-light';
    }
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Set data-theme attribute
    root.setAttribute('data-theme', theme);

    // Apply dark class for Tailwind compatibility
    root.classList.remove('dark', 'light');
    if (isDarkTheme(theme)) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    // Persist to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('[ThemeProvider] Error saving theme to localStorage:', error);
    }
  }, [theme]);

  // Function to change theme
  const setTheme = (newTheme) => {
    if (!VALID_THEMES.includes(newTheme)) {
      console.warn('[ThemeProvider] Invalid theme:', newTheme, 'Valid themes:', VALID_THEMES);
      return;
    }
    setCurrentTheme(newTheme);
  };

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      isDark: isDarkTheme(theme),
      isClassicTheme: isClassicTheme(theme),
      isNewTheme: isNewTheme(theme),
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
