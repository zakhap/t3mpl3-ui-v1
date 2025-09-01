'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { ReactNode, useState, useEffect } from 'react'

// Get the current URL for proper WalletConnect configuration
const getAppUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://t3mpl3-ui-v1.vercel.app'
}

// Create Wagmi config for Sepolia testnet with Alchemy RPC  
// Use the working hardcoded key for now to avoid environment variable issues
const alchemyRpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/g0r1SYyQzVqIv28OW67TTaMVGivvJ09Z';

console.log('🔧 [WAGMI CONFIG] Configuring wagmi for SINGLE CHAIN - Sepolia only:', {
  chain: 'Sepolia',
  chainId: sepolia.id,
  rpcUrl: alchemyRpcUrl,
  chainsCount: 1,
  timestamp: new Date().toISOString()
});

const wagmiConfig = createConfig({
  chains: [sepolia], // Sepolia testnet only - simple and clean
  transports: {
    [sepolia.id]: http(alchemyRpcUrl), // Sepolia RPC
  },
})

// Ensure single instance of query client
let queryClient: QueryClient
if (typeof window !== 'undefined') {
  // Client-side: create or reuse existing
  if (!(window as any).__queryClient) {
    (window as any).__queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  }
  queryClient = (window as any).__queryClient
} else {
  // Server-side: always create new
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

interface PrivyWeb3ProviderProps {
  children: ReactNode
}

export default function PrivyWeb3Provider({ children }: PrivyWeb3ProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId="cm87sgnp2013ad6xo3n2r50ex"
      config={{
        // Only external wallets - no embedded wallets
        loginMethods: ['wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#00ff00',
          logo: undefined,
          showWalletLoginFirst: true, // Explicitly set to true to silence warning
        },
        // Completely disable embedded wallets
        embeddedWallets: {
          createOnLogin: 'off',
        },
        // Minimal external wallet config - avoid WalletConnect
        externalWallets: {
          metamask: true,
          coinbaseWallet: {
            connectionOptions: 'smartWalletOnly',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} initialState={undefined}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
