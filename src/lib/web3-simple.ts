import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Simple configuration without Web3Modal
export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(), // MetaMask, etc.
    // You can add walletConnect if you want, but it requires a project ID
    // walletConnect({ projectId: 'your-project-id' }),
  ],
  transports: {
    [mainnet.id]: http(), // Uses public RPC
    [sepolia.id]: http(), // Uses public RPC
  },
})
