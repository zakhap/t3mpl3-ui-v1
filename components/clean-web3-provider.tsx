'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/web3-clean'
import { ReactNode, useEffect } from 'react'

// Create query client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

export default function CleanWeb3Provider({
  children,
}: {
  children: ReactNode
}) {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Log the error but don't crash the app
      console.warn('Unhandled promise rejection:', event.reason)
      
      // Prevent the default behavior (which would log to console as error)
      event.preventDefault()
      
      // Handle specific wallet errors
      if (event.reason?.message?.includes('User rejected')) {
        console.log('User cancelled wallet connection')
      } else if (event.reason?.code === 4001) {
        console.log('User denied transaction signature')
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
