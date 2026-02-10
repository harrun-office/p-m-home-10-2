import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DataStoreProvider } from './store/dataStore.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { applyTheme, getTheme } from './store/themeStore.js'
import './index.css'
import App from './App.jsx'

applyTheme(getTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DataStoreProvider>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </DataStoreProvider>
  </StrictMode>,
)
