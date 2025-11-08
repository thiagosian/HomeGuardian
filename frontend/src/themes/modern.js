import { createTheme } from '@mui/material/styles';

/**
 * Modern Theme - A professional dark theme inspired by modern development tools
 * Features high contrast, vibrant neon accents, and an obsidian background
 */
const modernTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff', // Electric cyan blue
      light: '#40c4ff',
      dark: '#00b8d4',
      contrastText: '#111318',
    },
    secondary: {
      main: '#1de9b6', // Electric green
      light: '#00f2a1',
      dark: '#00bfa5',
      contrastText: '#111318',
    },
    error: {
      main: '#f50057', // Vibrant magenta red
      light: '#ff4081',
      dark: '#c51162',
    },
    warning: {
      main: '#ffab00',
      light: '#ffd740',
      dark: '#ff8f00',
    },
    info: {
      main: '#00e5ff',
      light: '#40c4ff',
      dark: '#00b8d4',
    },
    success: {
      main: '#1de9b6',
      light: '#00f2a1',
      dark: '#00bfa5',
    },
    background: {
      default: '#111318', // Obsidian/charcoal background
      paper: '#2a2a2e', // Subtle elevation from background
    },
    text: {
      primary: '#fafafa', // Almost white for maximum readability
      secondary: '#b0b0b0', // Light gray for secondary text
      disabled: '#6a6a6a',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    // Custom diff colors for Modern theme - vibrant neon accents
    diff: {
      addedBg: 'rgba(29, 233, 182, 0.15)', // Green with transparency
      addedText: '#00f2a1', // Bright electric green
      removedBg: 'rgba(245, 0, 87, 0.15)', // Red with transparency
      removedText: '#ff4081', // Bright magenta red
      headerBg: 'rgba(0, 229, 255, 0.1)', // Blue with transparency
      headerText: '#40c4ff', // Electric cyan
      viewerBg: '#1a1a1a', // Slightly lighter than default background
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    // Enhanced typography for better readability on dark background
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Remove uppercase transformation
          borderRadius: 4,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default MUI gradient
          border: '1px solid rgba(255, 255, 255, 0.08)', // Subtle border
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default MUI gradient
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
  },
});

export default modernTheme;
