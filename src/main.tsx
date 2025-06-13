import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './globals.css'
import './patterns.css'
import { ThemeProvider } from '@/components/theme-provider'
import PrivyWeb3Provider from '@/components/privy-web3-provider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyWeb3Provider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <App />
      </ThemeProvider>
    </PrivyWeb3Provider>
  </React.StrictMode>,
)