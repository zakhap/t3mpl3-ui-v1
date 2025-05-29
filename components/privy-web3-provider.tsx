'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { ReactNode, useState, useEffect } from 'react'

// Create Wagmi config for Privy - minimal setup
const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

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
