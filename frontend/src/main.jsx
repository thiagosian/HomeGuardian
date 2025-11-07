import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.jsx'
import './i18n'
import { getRouterBasename } from './config/ingress'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#03a9f4',
    },
    secondary: {
      main: '#ff9800',
    },
  },
});

// Detect ingress base path for Home Assistant compatibility
const basename = getRouterBasename();
console.log('[HomeGuardian] Router basename:', basename);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
