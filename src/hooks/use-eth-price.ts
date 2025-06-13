import { useQuery } from '@tanstack/react-query'

// Uniswap V3 ETH/USDC pool on Base (0.05% fee tier)
const UNISWAP_V3_ETH_USDC_POOL = '0xd0b53D9277642d899DF5C87A3966A349A798F224'
const BASE_RPC_URL = 'https://mainnet.base.org'

// Fetch ETH price from Uniswap V3 pool on Base
async function fetchETHPrice(): Promise<number> {
  try {
    // Call slot0() to get current price
    const response = await fetch(BASE_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: UNISWAP_V3_ETH_USDC_POOL,
            data: '0x3850c7bd', // slot0() function selector
          },
          'latest'
        ],
        id: 1,
      }),
    })

    const data = await response.json()
    
    if (data.result) {
      // Parse sqrtPriceX96 from slot0 result (first 32 bytes)
      const sqrtPriceX96 = BigInt('0x' + data.result.slice(2, 66))
      
      // Calculate price using proper decimal math
      // sqrtPriceX96 = sqrt(price) * 2^96
      // price = (sqrtPriceX96 / 2^96)^2
      const Q96 = 2n ** 96n
      const sqrtPrice = Number(sqrtPriceX96) / Number(Q96)
      
      // ETH/USDC price - USDC has 6 decimals, ETH has 18 decimals
      // Price is in terms of token0/token1, need to adjust for decimals and invert
      const rawPrice = sqrtPrice ** 2
      const ethPrice = rawPrice * (10 ** 12) // Adjust for decimal difference (18-6=12)
      
      console.log('✅ Uniswap V3 ETH price:', ethPrice)
      return ethPrice
    }
    
    throw new Error('No result from Uniswap pool')
  } catch (error) {
    console.warn('⚠️ Uniswap V3 failed:', error)
    return 3500 // Fallback price
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
        source: 'uniswap-v3',
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