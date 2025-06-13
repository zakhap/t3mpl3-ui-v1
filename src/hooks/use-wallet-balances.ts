import { useQuery } from '@tanstack/react-query'
import { usePrivy } from '@privy-io/react-auth'

// Mainnet contract addresses
const MAINNET_USDC = '0xA0b86a33E6441056F39b4c3a48C30b8C83D2Ffa7' // USDC on mainnet
const SEPOLIA_USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // USDC on sepolia (for testing)

// Simple balance fetching using public RPC
async function fetchETHBalance(address: string): Promise<string> {
  try {
    // Using public Ethereum RPC
    const response = await fetch('https://eth.llamarpc.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    })
    
    const data = await response.json()
    
    if (data.result) {
      // Convert hex to decimal and format
      const balanceWei = BigInt(data.result)
      const balanceEth = Number(balanceWei) / Math.pow(10, 18)
      return balanceEth.toFixed(4)
    }
    
    return '0.0000'
  } catch (error) {
    console.warn('Failed to fetch ETH balance:', error)
    return '0.0000'
  }
}

// Fetch USDC balance using ERC20 balanceOf call
async function fetchUSDCBalance(address: string): Promise<string> {
  try {
    // ERC20 balanceOf function signature
    const balanceOfSignature = '0x70a08231'
    const paddedAddress = address.slice(2).padStart(64, '0')
    const data = balanceOfSignature + paddedAddress
    
    const response = await fetch('https://eth.llamarpc.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: MAINNET_USDC,
            data: data,
          },
          'latest'
        ],
        id: 1,
      }),
    })
    
    const result = await response.json()
    
    if (result.result && result.result !== '0x') {
      // Convert hex to decimal and format (USDC has 6 decimals)
      const balanceRaw = BigInt(result.result)
      const balanceUsdc = Number(balanceRaw) / Math.pow(10, 6)
      return balanceUsdc.toFixed(2)
    }
    
    return '0.00'
  } catch (error) {
    console.warn('Failed to fetch USDC balance:', error)
    return '0.00'
  }
}

// Main hook for wallet balances
export function useWalletBalances() {
  const { authenticated, user } = usePrivy()
  const walletAddress = user?.wallet?.address

  return useQuery({
    queryKey: ['wallet-balances', walletAddress],
    queryFn: async () => {
      if (!walletAddress) {
        throw new Error('No wallet connected')
      }

      console.log('🔍 Fetching balances for:', walletAddress)

      // Fetch both balances in parallel
      const [ethBalance, usdcBalance] = await Promise.all([
        fetchETHBalance(walletAddress),
        fetchUSDCBalance(walletAddress),
      ])

      console.log('💰 ETH Balance:', ethBalance)
      console.log('💰 USDC Balance:', usdcBalance)

      return {
        eth: ethBalance,
        usdc: usdcBalance,
        address: walletAddress,
        timestamp: Date.now(),
      }
    },
    enabled: authenticated && !!walletAddress,
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 10000,       // Consider data stale after 10 seconds
    retry: 2,
    retryDelay: 1000,
  })
}

// Hook with loading and error states
export function useWalletBalancesWithState() {
  const { data, isLoading, isError, error, refetch } = useWalletBalances()
  const { authenticated } = usePrivy()
  
  return {
    ethBalance: data?.eth || '0.0000',
    usdcBalance: data?.usdc || '0.00',
    loading: isLoading,
    error: isError ? error : null,
    connected: authenticated,
    refetch,
    // Formatted for display
    formattedEth: data?.eth ? `${data.eth} ETH` : '0.0000 ETH',
    formattedUsdc: data?.usdc ? `${data.usdc} USDC` : '0.00 USDC',
  }
}