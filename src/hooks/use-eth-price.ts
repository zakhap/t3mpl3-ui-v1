import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { QuoteManager } from '@/lib/uniswap-v4'

// Create viem public client for Base with Alchemy
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/g0r1SYyQzVqIv28OW67TTaMVGivvJ09Z'),
})

// Fetch ETH price from Uniswap V4 Quoter on Base
async function fetchETHPrice(): Promise<number> {
  try {
    // Initialize QuoteManager with Base public client
    const quoteManager = new QuoteManager(publicClient as any)
    
    // Get current ETH price using V4 Quoter
    const ethPrice = await quoteManager.getETHPrice()
    
    if (ethPrice && ethPrice > 0) {
      console.log('✅ V4 Quoter ETH price:', ethPrice)
      return ethPrice
    }
    
    throw new Error('Invalid V4 quote data')
  } catch (error) {
    console.warn('⚠️ Uniswap V4 Quoter failed, using CoinGecko fallback:', error)
    
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
    formattedPrice: data?.price ? `1ETH = $${data.price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}` : '1ETH = $3,500.00',
  }
}