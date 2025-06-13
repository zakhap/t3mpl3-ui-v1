import { useQuery } from '@tanstack/react-query'

// External price feed endpoints
const PRICE_FEEDS = {
  COINGECKO_ETH_USD: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
  COINBASE_ETH_USD: 'https://api.exchange.coinbase.com/products/ETH-USD/ticker',
  BINANCE_ETH_USDT: 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
} as const

// Fetch price from external API with fallbacks
async function fetchETHPrice(): Promise<number> {
  // Try CoinGecko first (most reliable)
  try {
    const response = await fetch(PRICE_FEEDS.COINGECKO_ETH_USD)
    const data = await response.json()
    
    if (data.ethereum?.usd && typeof data.ethereum.usd === 'number') {
      console.log('✅ CoinGecko ETH price:', data.ethereum.usd)
      return data.ethereum.usd
    }
    throw new Error('Invalid CoinGecko response')
  } catch (error) {
    console.warn('⚠️ CoinGecko failed:', error)
  }

  // Fallback to Coinbase
  try {
    const response = await fetch(PRICE_FEEDS.COINBASE_ETH_USD)
    const data = await response.json()
    
    if (data.price && typeof data.price === 'string') {
      const price = parseFloat(data.price)
      console.log('✅ Coinbase ETH price:', price)
      return price
    }
    throw new Error('Invalid Coinbase response')
  } catch (error) {
    console.warn('⚠️ Coinbase failed:', error)
  }

  // Fallback to Binance
  try {
    const response = await fetch(PRICE_FEEDS.BINANCE_ETH_USDT)
    const data = await response.json()
    
    if (data.price && typeof data.price === 'string') {
      const price = parseFloat(data.price)
      console.log('✅ Binance ETH price:', price)
      return price
    }
    throw new Error('Invalid Binance response')
  } catch (error) {
    console.warn('⚠️ Binance failed:', error)
  }

  // If all APIs fail, return a reasonable fallback
  console.warn('❌ All price feeds failed, using fallback')
  return 3500
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
        source: 'external-api',
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,       // Consider data stale after 15 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}` : '$3,500',
  }
}