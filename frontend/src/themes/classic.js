import { createTheme } from '@mui/material/styles';

/**
 * Classic Theme - The original HomeGuardian theme
 * Light mode with cyan primary and orange secondary colors
 */
const classicTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#03a9f4', // Cyan/Light Blue
    },
    secondary: {
      main: '#ff9800', // Orange
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#24292e',
      secondary: '#6a737d',
    },
    // Custom diff colors for Classic theme
    diff: {
      addedBg: '#e6ffed',
      addedText: '#24292e',
      removedBg: '#ffeef0',
      removedText: '#24292e',
      headerBg: '#f1f8ff',
      headerText: '#6a737d',
      viewerBg: '#f6f8fa',
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
  },
});

export default classicTheme;
