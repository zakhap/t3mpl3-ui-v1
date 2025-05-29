'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { State, WagmiProvider } from 'wagmi'
import { config, projectId } from '@/lib/web3'
import { ReactNode, useState, useEffect } from 'react'

// Setup queryClient
const queryClient = new QueryClient()

if (!projectId) throw new Error('Project ID is not defined')

// Create modal with error handling
try {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    enableAnalytics: false, // Disable analytics to reduce errors
    themeMode: 'dark',
    themeVariables: {
      '--w3m-color-mix': '#00ff00',
      '--w3m-color-mix-strength': 20,
      '--w3m-accent': '#00ff00',
      '--w3m-border-radius-master': '0px',
      '--w3m-font-family': 'Courier New, monospace',
    },
    // Add error handling options
    enableOnramp: false,
    enableSwaps: false,
  })
} catch (error) {
  console.warn('Web3Modal initialization error:', error)
  // Modal will still work for basic connections even with some errors
}

export default function Web3Provider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: State
}) {
  // Add error handling for wallet connection issues
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Connection interrupted')) {
        // Silently handle WalletConnect connection interruptions
        event.preventDefault()
        console.warn('WalletConnect connection interrupted - this is normal')
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (hasError) {
    return (
      <div className="p-4 text-center">
        <p>Web3 connection error. Please refresh the page.</p>
        <button onClick={() => setHasError(false)}>Retry</button>
      </div>
    )
  }

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
