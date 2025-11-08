/**
 * TAILWIND CSS INTEGRATION - HOMEGUARDIAN THEMES
 *
 * This file demonstrates how to integrate the extracted MUI theme colors
 * into a Tailwind CSS configuration for shadcn/ui components.
 */

// ============================================================================
// OPTION 1: Direct Tailwind Config (tailwind.config.js)
// ============================================================================

module.exports = {
  theme: {
    extend: {
      colors: {
        // CLASSIC THEME COLORS
        classic: {
          primary: 'hsl(199 98% 48%)',     // Cyan
          secondary: 'hsl(36 100% 50%)',   // Orange
          bg: {
            default: 'hsl(0 0% 98%)',      // Off-white
            paper: 'hsl(0 0% 100%)',       // White
          },
          text: {
            primary: 'hsl(210 12% 16%)',   // Dark charcoal
            secondary: 'hsl(212 8% 45%)',  // Medium gray
          },
          diff: {
            addedBg: 'hsl(137 100% 95%)',
            addedText: 'hsl(210 12% 16%)',
            removedBg: 'hsl(353 100% 97%)',
            removedText: 'hsl(210 12% 16%)',
            headerBg: 'hsl(210 100% 97%)',
            headerText: 'hsl(212 8% 45%)',
            viewerBg: 'hsl(210 29% 97%)',
          },
        },

        // MODERN THEME COLORS
        modern: {
          primary: {
            main: 'hsl(186 100% 50%)',     // Electric cyan
            light: 'hsl(199 100% 63%)',    // Light cyan
            dark: 'hsl(188 100% 42%)',     // Dark cyan
          },
          secondary: {
            main: 'hsl(165 82% 51%)',      // Electric teal
            light: 'hsl(160 100% 47%)',    // Bright green
            dark: 'hsl(172 100% 37%)',     // Dark teal
          },
          bg: {
            default: 'hsl(223 17% 8%)',    // Obsidian
            paper: 'hsl(240 5% 17%)',      // Elevated surface
          },
          text: {
            primary: 'hsl(0 0% 98%)',      // Almost white
            secondary: 'hsl(0 0% 69%)',    // Light gray
            disabled: 'hsl(0 0% 42%)',     // Medium gray
          },
          status: {
            error: {
              main: 'hsl(339 100% 48%)',
              light: 'hsl(340 100% 63%)',
              dark: 'hsl(333 84% 42%)',
            },
            warning: {
              main: 'hsl(40 100% 50%)',
              light: 'hsl(47 100% 63%)',
              dark: 'hsl(34 100% 50%)',
            },
            success: {
              main: 'hsl(165 82% 51%)',
              light: 'hsl(160 100% 47%)',
              dark: 'hsl(172 100% 37%)',
            },
            info: {
              main: 'hsl(186 100% 50%)',
              light: 'hsl(199 100% 63%)',
              dark: 'hsl(188 100% 42%)',
            },
          },
          diff: {
            addedBg: 'rgba(29, 233, 182, 0.15)',
            addedText: 'hsl(160 100% 47%)',
            removedBg: 'rgba(245, 0, 87, 0.15)',
            removedText: 'hsl(340 100% 63%)',
            headerBg: 'rgba(0, 229, 255, 0.1)',
            headerText: 'hsl(199 100% 63%)',
            viewerBg: 'hsl(0 0% 10%)',
          },
        },
      },
    },
  },
};

// ============================================================================
// OPTION 2: CSS Custom Properties (RECOMMENDED)
// ============================================================================

/**
 * File: src/styles/themes/classic.css
 *
 * Usage: Add this stylesheet when theme is set to "classic"
 */
const classicThemeCss = `
:root[data-theme="classic"] {
  /* PRIMARY & SECONDARY */
  --color-primary: hsl(199 98% 48%);
  --color-secondary: hsl(36 100% 50%);

  /* BACKGROUND */
  --color-bg-default: hsl(0 0% 98%);
  --color-bg-paper: hsl(0 0% 100%);

  /* TEXT */
  --color-text-primary: hsl(210 12% 16%);
  --color-text-secondary: hsl(212 8% 45%);

  /* DIFF COLORS */
  --color-diff-added-bg: hsl(137 100% 95%);
  --color-diff-added-text: hsl(210 12% 16%);
  --color-diff-removed-bg: hsl(353 100% 97%);
  --color-diff-removed-text: hsl(210 12% 16%);
  --color-diff-header-bg: hsl(210 100% 97%);
  --color-diff-header-text: hsl(212 8% 45%);
  --color-diff-viewer-bg: hsl(210 29% 97%);
}

/* Using the custom properties */
.classic-theme {
  background-color: var(--color-bg-default);
  color: var(--color-text-primary);
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
}
`;

/**
 * File: src/styles/themes/modern.css
 *
 * Usage: Add this stylesheet when theme is set to "modern"
 */
const modernThemeCss = `
:root[data-theme="modern"] {
  /* PRIMARY */
  --color-primary-main: hsl(186 100% 50%);
  --color-primary-light: hsl(199 100% 63%);
  --color-primary-dark: hsl(188 100% 42%);

  /* SECONDARY */
  --color-secondary-main: hsl(165 82% 51%);
  --color-secondary-light: hsl(160 100% 47%);
  --color-secondary-dark: hsl(172 100% 37%);

  /* BACKGROUND */
  --color-bg-default: hsl(223 17% 8%);
  --color-bg-paper: hsl(240 5% 17%);

  /* TEXT */
  --color-text-primary: hsl(0 0% 98%);
  --color-text-secondary: hsl(0 0% 69%);
  --color-text-disabled: hsl(0 0% 42%);

  /* STATUS - ERROR */
  --color-error-main: hsl(339 100% 48%);
  --color-error-light: hsl(340 100% 63%);
  --color-error-dark: hsl(333 84% 42%);

  /* STATUS - WARNING */
  --color-warning-main: hsl(40 100% 50%);
  --color-warning-light: hsl(47 100% 63%);
  --color-warning-dark: hsl(34 100% 50%);

  /* STATUS - SUCCESS */
  --color-success-main: hsl(165 82% 51%);
  --color-success-light: hsl(160 100% 47%);
  --color-success-dark: hsl(172 100% 37%);

  /* STATUS - INFO */
  --color-info-main: hsl(186 100% 50%);
  --color-info-light: hsl(199 100% 63%);
  --color-info-dark: hsl(188 100% 42%);

  /* DIFF COLORS */
  --color-diff-added-bg: rgba(29, 233, 182, 0.15);
  --color-diff-added-text: hsl(160 100% 47%);
  --color-diff-removed-bg: rgba(245, 0, 87, 0.15);
  --color-diff-removed-text: hsl(340 100% 63%);
  --color-diff-header-bg: rgba(0, 229, 255, 0.1);
  --color-diff-header-text: hsl(199 100% 63%);
  --color-diff-viewer-bg: hsl(0 0% 10%);
}

/* Using the custom properties */
.modern-theme {
  background-color: var(--color-bg-default);
  color: var(--color-text-primary);
}

.button-primary {
  background-color: var(--color-primary-main);
  color: var(--color-text-primary);
}

.button-primary:hover {
  background-color: var(--color-primary-light);
}

.button-primary:active {
  background-color: var(--color-primary-dark);
}

.alert-error {
  background-color: var(--color-error-main);
  color: white;
}

.diff-added {
  background-color: var(--color-diff-added-bg);
  color: var(--color-diff-added-text);
}

.diff-removed {
  background-color: var(--color-diff-removed-bg);
  color: var(--color-diff-removed-text);
}
`;

// ============================================================================
// OPTION 3: Context-Based Theme Management (React)
// ============================================================================

/**
 * File: src/contexts/ThemeContext.jsx
 */
const ThemeContextExample = `
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

// Color palettes extracted from MUI themes
const THEME_COLORS = {
  classic: {
    primary: 'hsl(199 98% 48%)',
    secondary: 'hsl(36 100% 50%)',
    background: 'hsl(0 0% 98%)',
    text: 'hsl(210 12% 16%)',
    // ... rest of colors
  },
  modern: {
    primary: {
      main: 'hsl(186 100% 50%)',
      light: 'hsl(199 100% 63%)',
      dark: 'hsl(188 100% 42%)',
    },
    secondary: {
      main: 'hsl(165 82% 51%)',
      light: 'hsl(160 100% 47%)',
      dark: 'hsl(172 100% 37%)',
    },
    background: 'hsl(223 17% 8%)',
    text: 'hsl(0 0% 98%)',
    // ... rest of colors
  },
};

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('modern');
  const colors = THEME_COLORS[themeName];

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
`;

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Using with HTML attributes
 */
const htmlExample = `
<!-- Set theme on root element -->
<html data-theme="modern">
  <body>
    <!-- Colors will be applied via CSS custom properties -->
    <button class="button-primary">Click me</button>
  </body>
</html>
`;

/**
 * Example 2: Using with Tailwind classes
 */
const tailwindExample = `
<div className="bg-modern-bg-default text-modern-text-primary">
  <button className="bg-modern-primary-main text-white hover:bg-modern-primary-light">
    Primary Button
  </button>

  <button className="bg-modern-status-error-main text-white hover:bg-modern-status-error-light">
    Error Button
  </button>

  <div className="bg-modern-diff-added-bg text-modern-diff-added-text p-4 rounded">
    Added content will appear here
  </div>
</div>
`;

/**
 * Example 3: Using with CSS custom properties
 */
const cssExample = `
.card {
  background-color: var(--color-bg-paper);
  color: var(--color-text-primary);
  border: 1px solid var(--color-text-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
}

.card-primary-action {
  background-color: var(--color-primary-main);
  color: white;
}

.card-primary-action:hover {
  background-color: var(--color-primary-light);
}

.alert-wrapper {
  background-color: var(--color-error-main);
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
}
`;

/**
 * Example 4: Using with React inline styles
 */
const reactExample = `
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { colors } = useTheme();

  return (
    <div style={{ backgroundColor: colors.background, color: colors.text }}>
      <button
        style={{
          backgroundColor: colors.primary,
          color: 'white',
        }}
      >
        Click me
      </button>
    </div>
  );
}
`;

/**
 * Example 5: Using with shadcn/ui components
 */
const shadcnExample = `
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { colors } = useTheme();

  return (
    <div className="bg-[var(--color-bg-default)] text-[var(--color-text-primary)]">
      <Button
        className="bg-[var(--color-primary-main)] hover:bg-[var(--color-primary-light)]"
      >
        Primary Action
      </Button>

      <Button
        variant="destructive"
        className="bg-[var(--color-error-main)] hover:bg-[var(--color-error-light)]"
      >
        Delete
      </Button>
    </div>
  );
}
`;

// ============================================================================
// DYNAMIC THEME SWITCHING
// ============================================================================

/**
 * Helper function to switch themes
 */
function switchTheme(themeName) {
  const html = document.documentElement;

  // Update data attribute for CSS custom properties
  html.setAttribute('data-theme', themeName);

  // Save preference
  localStorage.setItem('theme', themeName);

  // Dispatch event for listeners
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeName } }));
}

/**
 * Initialize theme on page load
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'modern';
  switchTheme(savedTheme);
}

// ============================================================================
// EXPORTS FOR REFERENCE
// ============================================================================

export {
  classicThemeCss,
  modernThemeCss,
  htmlExample,
  tailwindExample,
  cssExample,
  reactExample,
  shadcnExample,
  switchTheme,
  initializeTheme,
};
