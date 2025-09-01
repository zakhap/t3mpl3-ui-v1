import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { QuoteManager } from '@/lib/uniswap-v4'

// Create viem public client for Sepolia with Alchemy
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://eth-sepolia.g.alchemy.com/v2/g0r1SYyQzVqIv28OW67TTaMVGivvJ09Z'),
})

// Fetch ETH to TEMPLE exchange rate from Uniswap V4 Quoter on Sepolia
async function fetchETHToTempleRate(): Promise<number> {
  try {
    // Initialize QuoteManager with Sepolia public client
    const quoteManager = new QuoteManager(publicClient as any)
    
    // Get quote for 1 ETH -> TEMPLE to get the exchange rate
    const quote = await quoteManager.getBuyQuote("1")
    
    if (quote && quote.amountOut) {
      // Convert from Temple wei to readable format (18 decimals)
      const templePerEth = Number(quote.amountOut) / 1e18
      console.log('✅ V4 Quoter: 1 ETH = ', templePerEth, 'TEMPLE')
      return templePerEth
    }
    
    throw new Error('Invalid V4 quote data')
  } catch (error) {
    console.warn('⚠️ Uniswap V4 Quoter failed, using fallback:', error)
    
    // Fallback to a reasonable default rate
    // This could be updated based on your expected exchange rate
    return 1000 // Default: 1 ETH = 1000 TEMPLE
  }
}

// Main hook for fetching ETH to TEMPLE exchange rate
export function useETHPrice() {
  return useQuery({
    queryKey: ['eth-temple-rate'],
    queryFn: async () => {
      const rate = await fetchETHToTempleRate()
      
      return {
        price: rate, // This is now TEMPLE per ETH
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
    price: data?.price || 1000, // Fallback to 1 ETH = 1000 TEMPLE
    source: data?.source || 'fallback',
    loading: isLoading,
    error: isError ? error : null,
    timestamp: data?.timestamp,
    // Formatted price for display - now showing TEMPLE per ETH
    formattedPrice: data?.price ? `1 ETH = ${data.price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 18 
    })} TEMPLE` : '1 ETH = 1,000.00 TEMPLE',
  }
}