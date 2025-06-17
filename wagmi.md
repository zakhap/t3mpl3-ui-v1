# Wagmi React Development Guide

Wagmi has become the standard for React web3 development, providing type-safe hooks and comprehensive wallet management. This guide covers battle-tested patterns, common pitfalls, and production-ready implementations based on official documentation and community best practices.

## Provider setup and configuration patterns

**Modern wagmi applications require a specific provider hierarchy** using WagmiProvider and TanStack Query's QueryClientProvider. The configuration determines chain support, transport methods, and connector options.

```typescript
// config.ts - Centralized configuration
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID }),
    coinbaseWallet({ appName: 'Your App Name' }),
  ],
  transports: {
    [mainnet.id]: http('YOUR_MAINNET_RPC_URL'),
    [sepolia.id]: http(),
    [polygon.id]: http('YOUR_POLYGON_RPC_URL'),
    [arbitrum.id]: http('YOUR_ARBITRUM_RPC_URL'),
  },
  ssr: true, // Enable for Next.js applications
})

// Type safety registration
declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
```

```typescript
// App.tsx - Provider setup
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from './config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <YourAppContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

## Safe hook usage patterns and component structure

**The key to safe wagmi hook usage is proper state checking and error handling.** Each hook provides multiple state indicators that should be used to create robust user experiences.

### Account management patterns

```typescript
import { useAccount, useConnect, useDisconnect } from 'wagmi'

function WalletManager() {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    isReconnecting, 
    isDisconnected,
    status,
    chain,
    connector 
  } = useAccount({
    onConnect({ address, connector, isReconnected }) {
      console.log('Connected', { address, connector, isReconnected })
    },
    onDisconnect() {
      console.log('Disconnected')
    },
  })

  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()

  // Handle different connection states
  if (isConnecting || isReconnecting) {
    return <div>Connecting to wallet...</div>
  }

  if (isDisconnected) {
    return (
      <div>
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            disabled={!connector.ready || isPending}
          >
            {connector.name}
            {isPending && ' (connecting)'}
          </button>
        ))}
        {error && <div>Error: {error.message}</div>}
      </div>
    )
  }

  return (
    <div>
      <div>Connected: {address}</div>
      <div>Chain: {chain?.name}</div>
      <div>Connector: {connector?.name}</div>
      <button onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  )
}
```

### Transaction handling with proper error management

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { type BaseError } from 'wagmi'

function TransactionComponent() {
  const { 
    data: hash, 
    isPending: isWriting, 
    writeContract,
    error: writeError 
  } = useWriteContract()

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError 
  } = useWaitForTransactionReceipt({ hash })

  const handleError = (error: BaseError) => {
    if (error.name === 'UserRejectedRequestError') {
      return 'Transaction was rejected by user'
    }
    if (error.name === 'InsufficientFundsError') {
      return 'Insufficient funds for transaction'
    }
    if (error.name === 'ContractFunctionExecutionError') {
      return `Contract error: ${error.shortMessage}`
    }
    return error.message || 'Unknown error occurred'
  }

  const executeTransaction = () => {
    writeContract({
      address: '0x...',
      abi: contractAbi,
      functionName: 'transfer',
      args: ['0x...', parseEther('0.1')],
    })
  }

  return (
    <div>
      <button 
        onClick={executeTransaction}
        disabled={isWriting || isConfirming}
      >
        {isWriting && 'Waiting for wallet confirmation...'}
        {isConfirming && 'Transaction confirming...'}
        {!isWriting && !isConfirming && 'Send Transaction'}
      </button>

      {isConfirmed && (
        <div>Transaction confirmed! Hash: {hash}</div>
      )}

      {(writeError || confirmError) && (
        <div>
          Error: {handleError(writeError || confirmError)}
        </div>
      )}
    </div>
  )
}
```

## Provider readiness detection and initialization patterns

**One critical challenge is ensuring wagmi hooks are called only after the provider is properly initialized.** This is especially important for SSR applications and complex wallet setups.

### SSR-safe component patterns

```typescript
import { useEffect, useLayoutEffect, useState } from 'react'
import { useAccount } from 'wagmi'

// SSR-safe hook for client-side rendering
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function useIsMounted() {
  const [mounted, setMounted] = useState(false)
  
  useIsomorphicLayoutEffect(() => {
    setMounted(true)
  }, [])
  
  return mounted
}

function SafeWalletComponent() {
  const isMounted = useIsMounted()
  const { isConnected, address } = useAccount()

  if (!isMounted) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {isConnected ? `Connected: ${address}` : 'Not connected'}
    </div>
  )
}
```

### Next.js App Router setup with proper SSR handling

```typescript
// app/config.ts
import { cookieStorage, createStorage } from 'wagmi'

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  })
}

// app/providers.tsx (Client Component)
'use client'
import { type ReactNode, useState } from 'react'
import { type State, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getConfig } from './config'

type Props = {
  children: ReactNode
  initialState: State | undefined
}

export function Providers({ children, initialState }: Props) {
  const [config] = useState(() => getConfig())
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// app/layout.tsx (Server Component)
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { getConfig } from './config'
import { Providers } from './providers'

export default async function Layout({ children }) {
  const initialState = cookieToInitialState(
    getConfig(),
    (await headers()).get('cookie')
  )
  
  return (
    <html>
      <body>
        <Providers initialState={initialState}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### Connector readiness checking

```typescript
import { useConnect, Connector } from 'wagmi'
import { useEffect, useState } from 'react'

function WalletOption({ connector }: { connector: Connector }) {
  const [ready, setReady] = useState(false)
  const { connect } = useConnect()

  useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <button 
      disabled={!ready} 
      onClick={() => connect({ connector })}
    >
      {connector.name} {!ready && '(installing...)'}
    </button>
  )
}
```

## Chain ID detection: multiple approaches and reliability

**The most reliable approach for chain ID detection depends on your specific use case.** Different methods have varying reliability, especially with wallet switching and unsupported networks.

### Reliability ranking of detection methods

#### Primary method: useAccount for connected states
```typescript
import { useAccount, useChainId } from 'wagmi'

function useReliableChainId() {
  const { chainId: accountChainId, chain, isConnected } = useAccount()
  const configChainId = useChainId()
  
  return {
    chainId: isConnected ? accountChainId : configChainId,
    isSupported: !!chain,
    isConnected,
    actualChainId: accountChainId, // Real wallet chain
    configuredChainId: configChainId, // From wagmi config
  }
}
```

#### Fallback: direct provider access
```typescript
import { useConnectorClient } from 'wagmi'

function useDirectChainId() {
  const { data: client } = useConnectorClient()
  const [directChainId, setDirectChainId] = useState<number | null>(null)
  
  useEffect(() => {
    if (!client) return
    
    const getChainId = async () => {
      try {
        const result = await client.request({ method: 'eth_chainId' })
        setDirectChainId(parseInt(result, 16))
      } catch (error) {
        console.error('Failed to get direct chain ID:', error)
      }
    }
    
    getChainId()
  }, [client])
  
  return directChainId
}
```

#### Multi-method approach for maximum reliability
```typescript
function useProductionChainId() {
  const { chainId: accountChainId, chain, isConnected } = useAccount()
  const configChainId = useChainId()
  const { data: client } = useConnectorClient()
  const [directChainId, setDirectChainId] = useState<number | null>(null)
  
  useEffect(() => {
    if (!client) return
    
    const fetchDirectChainId = async () => {
      try {
        const result = await client.request({ method: 'eth_chainId' })
        setDirectChainId(parseInt(result, 16))
      } catch (error) {
        console.error('Direct chain ID fetch failed:', error)
      }
    }
    
    fetchDirectChainId()
  }, [client])
  
  // Priority: Account chainId > Direct provider > Config chainId
  const effectiveChainId = accountChainId || directChainId || configChainId
  
  return {
    chainId: effectiveChainId,
    isSupported: !!chain,
    isUnsupported: isConnected && !chain,
    methods: {
      account: accountChainId,
      direct: directChainId,
      config: configChainId,
    }
  }
}
```

### Network switching handling

```typescript
import { useSwitchChain } from 'wagmi'

function useNetworkManager() {
  const { chainId, chain } = useAccount()
  const { switchChain, isPending, error } = useSwitchChain()
  const [previousChainId, setPreviousChainId] = useState<number>()
  
  useEffect(() => {
    if (chainId !== previousChainId && previousChainId !== undefined) {
      console.log(`Network changed from ${previousChainId} to ${chainId}`)
      // Handle network change logic here
    }
    setPreviousChainId(chainId)
  }, [chainId, previousChainId])
  
  const switchToNetwork = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId })
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }
  
  return {
    currentChainId: chainId,
    currentChain: chain,
    isUnsupportedNetwork: !chain,
    switchToNetwork,
    isSwitching: isPending,
    switchError: error,
  }
}
```

## Loading states and user experience patterns

**Effective loading state management is crucial for web3 UX** because blockchain operations are inherently slower than traditional web interactions.

### Skeleton UI patterns

```typescript
// Reusable skeleton components
function WalletSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-32"></div>
          <div className="h-3 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}

function BalanceSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-20 mb-2"></div>
      <div className="h-8 bg-gray-300 rounded w-32"></div>
    </div>
  )
}

// Progressive loading implementation
function Portfolio() {
  const { address } = useAccount()
  const { data: balance, status: balanceStatus } = useBalance({ address })
  const { data: ensName, status: ensStatus } = useEnsName({ address })
  
  return (
    <div className="space-y-4">
      <h2>Your Portfolio</h2>
      
      {/* Show skeleton while loading */}
      {balanceStatus === 'pending' ? (
        <BalanceSkeleton />
      ) : (
        <div>
          <div className="text-sm text-gray-600">Balance</div>
          <div className="text-2xl font-bold">
            {balance?.formatted} {balance?.symbol}
          </div>
        </div>
      )}
      
      {/* Progressive loading for secondary data */}
      <div>
        {ensStatus === 'pending' ? (
          <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
        ) : (
          <div>{ensName || 'No ENS name'}</div>
        )}
      </div>
    </div>
  )
}
```

### Multi-step transaction feedback

```typescript
function MultiStepTransaction() {
  const [step, setStep] = useState(1)
  const { writeContract: approve, isPending: isApproving } = useWriteContract()
  const { writeContract: execute, isPending: isExecuting } = useWriteContract()

  const steps = [
    { id: 1, title: 'Approve Token', status: step > 1 ? 'complete' : step === 1 ? 'current' : 'upcoming' },
    { id: 2, title: 'Execute Transaction', status: step > 2 ? 'complete' : step === 2 ? 'current' : 'upcoming' },
    { id: 3, title: 'Confirmation', status: step === 3 ? 'current' : 'upcoming' }
  ]

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {steps.map((stepItem, index) => (
          <div key={stepItem.id} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${stepItem.status === 'complete' ? 'bg-green-500 text-white' : 
                stepItem.status === 'current' ? 'bg-blue-500 text-white' : 
                'bg-gray-300 text-gray-600'}
            `}>
              {stepItem.status === 'complete' ? '✓' : stepItem.id}
            </div>
            <span className="ml-2 text-sm font-medium">{stepItem.title}</span>
            {index < steps.length - 1 && (
              <div className="w-16 h-1 bg-gray-300 mx-4"></div>
            )}
          </div>
        ))}
      </div>

      {/* Step-specific content */}
      {step === 1 && (
        <button
          disabled={isApproving}
          onClick={() => {
            approve({
              address: '0x...',
              abi: erc20Abi,
              functionName: 'approve',
              args: [spenderAddress, maxUint256],
            })
            setStep(2)
          }}
        >
          {isApproving ? 'Approving...' : 'Approve Token'}
        </button>
      )}
    </div>
  )
}
```

### Error boundaries for web3 applications

```typescript
import { ErrorBoundary } from 'react-error-boundary'

function Web3ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-semibold text-red-800 mb-2">
        Web3 Connection Error
      </h2>
      <p className="text-red-600 mb-4">
        {error.message || 'Something went wrong with the blockchain connection'}
      </p>
      <div className="space-x-3">
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}

function Web3ErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={Web3ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Web3 Error:', error, errorInfo)
        // Send to error tracking service
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

## Advanced patterns and performance optimization

### Custom hook composition for complex interactions

```typescript
function useWalletManager() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const { data: ensName } = useEnsName({ address })

  return {
    wallet: {
      address,
      isConnected,
      balance: balance?.formatted,
      ensName,
      chain: chain?.name,
      isSupported: !!chain,
    },
    actions: { connect, disconnect, connectors },
  }
}
```

### Optimistic updates with TanStack Query

```typescript
import { useQueryClient } from '@tanstack/react-query'

function OptimisticTransfer() {
  const queryClient = useQueryClient()
  const { address } = useAccount()
  
  const { writeContract } = useWriteContract({
    mutation: {
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['balance', address] })
        
        // Snapshot previous value
        const previousBalance = queryClient.getQueryData(['balance', address])
        
        // Optimistically update balance
        queryClient.setQueryData(['balance', address], (old: any) => ({
          ...old,
          value: old.value - variables.value
        }))
        
        return { previousBalance }
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousBalance) {
          queryClient.setQueryData(['balance', address], context.previousBalance)
        }
      },
      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: ['balance', address] })
      },
    }
  })

  return (
    <button onClick={() => writeContract({
      address: '0x...',
      abi: erc20Abi,
      functionName: 'transfer',
      args: ['0x...', parseEther('0.1')]
    })}>
      Send 0.1 ETH
    </button>
  )
}
```

## Production deployment considerations

### Environment configuration for reliability

```typescript
// Production config with fallbacks
export const config = createConfig({
  chains: [mainnet, polygon, arbitrum],
  transports: {
    [mainnet.id]: fallback([
      http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
      http(process.env.NEXT_PUBLIC_INFURA_URL),
      http(), // Public fallback
    ]),
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC),
  },
  connectors: [
    injected(),
    walletConnect({ 
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'Your App',
        description: 'Your App Description',
        url: 'https://yourapp.com',
        icons: ['https://yourapp.com/icon.png']
      }
    }),
  ],
})
```

### Performance monitoring and debugging

```typescript
// Custom query client with performance monitoring
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        // Don't retry user rejections
        if (error.name === 'UserRejectedRequestError') return false
        return failureCount < 3
      },
    },
  },
})

// Add performance logging
queryClient.setQueryDefaults(['balance'], {
  onSuccess: (data) => {
    console.log('Balance loaded:', performance.now())
  },
})
```

**Key takeaways for production wagmi applications**: Always implement multi-method chain ID detection for reliability, use proper SSR patterns for Next.js applications, implement comprehensive error boundaries, provide clear loading states with skeleton UIs, and configure transport fallbacks for network reliability. The combination of these patterns creates robust, user-friendly web3 applications that handle the inherent complexity of blockchain interactions gracefully.