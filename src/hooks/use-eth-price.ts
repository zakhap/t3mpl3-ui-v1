import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import PoolManagerABI from '@/lib/PoolManager.json'

// Uniswap V4 contracts on Base
const UNISWAP_V4_POOL_MANAGER = '0x498581ff718922c3f8e6a244956af099b2652b2b' // Base Uniswap V4 PoolManager
const ETH_USD_POOL_ID = '0x00a14e98a2250c7a9b97e0d73a271c7f390c3393cddb0e538507739f6429ea7f'
const BASE_RPC_URL = 'https://mainnet.base.org'

// Create viem public client for Base
const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
})

// Export for use in other files
export const BASE_UNISWAP_V4_POOL_MANAGER = UNISWAP_V4_POOL_MANAGER

// Fetch ETH price from Uniswap V4 PoolManager on Base
async function fetchETHPrice(): Promise<number> {
  try {
    // Use getSlot0 with the pool ID
    const poolState = await publicClient.readContract({
      address: UNISWAP_V4_POOL_MANAGER,
      abi: PoolManagerABI,
      functionName: 'getSlot0',
      args: [ETH_USD_POOL_ID],
    })
    
    console.log('🔍 V4 Pool State:', poolState)
    
    // poolState should contain [sqrtPriceX96, tick, protocolFee, lpFee]
    const sqrtPriceX96 = poolState[0] as bigint
    
    if (sqrtPriceX96 > 0n) {
      const Q96 = 2n ** 96n
      const sqrtPrice = Number(sqrtPriceX96) / Number(Q96)
      const rawPrice = sqrtPrice ** 2
      const ethPrice = rawPrice * (10 ** 12) // Adjust for decimal difference
      
      console.log('✅ Uniswap V4 ETH price:', ethPrice)
      return ethPrice
    }
    
    throw new Error('Invalid V4 pool state')
  } catch (error) {
    console.warn('⚠️ Uniswap V4 failed, using CoinGecko fallback:', error)
    
    // Fallback to CoinGecko
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      const data = await response.json()
      
      if (data.ethereum?.usd && typeof data.ethereum.usd === 'number') {
        console.log('✅ CoinGecko ETH price:', data.ethereum.usd)
        return data.ethereum.usd
      }
    } catch (fallbackError) {
      console.warn('⚠️ CoinGecko also failed:', fallbackError)
    }
    
    return 3500 // Final fallback
  }
}

// Main hook for fetching ETH price
export function useETHPrice() {
  return useQuery({
    queryKey: ['eth-price'],
    queryFn: async () => {
      const price = await fetchETHPrice()
      
      return {
        price,
        timestamp: Date.now(),
        source: 'uniswap-v4',
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds (faster for DEX prices)
    staleTime: 5000,        // Consider data stale after 5 seconds
    retry: 2,
    retryDelay: 1000,
  })
}

// Hook for getting price with loading and error states
export function useETHPriceWithState() {
  const { data, isLoading, isError, error } = useETHPrice()
  
  return {
    price: data?.price || 3500, // Fallback to reasonable default
    source: data?.source || 'fallback',
    loading: isLoading,
    error: isError ? error : null,
    timestamp: data?.timestamp,
    // Formatted price for display
    formattedPrice: data?.price ? `$${data.price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}` : '$3,500.00',
  }
}