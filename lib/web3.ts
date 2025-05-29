import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

// Get projectId from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'temp-project-id'

// More lenient project ID check
console.log('Using project ID:', projectId)

const metadata = {
  name: '$T3MPL3 Trading',
  description: 'Trade memes, accrue deductions',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  icons: []
}

// Create wagmiConfig with error handling
const chains = [mainnet, sepolia] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
})
