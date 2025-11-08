import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './i18n'
import { getRouterBasename } from './config/ingress'
import { ThemeProvider } from './contexts/ThemeContext'

// Detect ingress base path for Home Assistant compatibility
const basename = getRouterBasename();
console.log('[HomeGuardian] Router basename:', basename);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
