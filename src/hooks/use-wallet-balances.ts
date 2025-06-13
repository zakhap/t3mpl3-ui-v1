import { useQuery } from '@tanstack/react-query'
import { usePrivy } from '@privy-io/react-auth'
import { createPublicClient, http, getContract, formatEther, formatUnits } from 'viem'
import { base } from 'viem/chains'

// Base network contract addresses - let's verify this is correct
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const

// Create viem public client for Base
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
})

// Fetch ETH balance using viem
async function fetchETHBalance(address: string): Promise<string> {
  try {
    console.log('🔍 Fetching ETH balance for:', address)
    const balance = await publicClient.getBalance({
      address: address as `0x${string}`,
    })
    
    console.log('💰 Raw ETH balance:', balance.toString())
    const balanceEth = formatEther(balance)
    console.log('💰 Formatted ETH balance:', balanceEth)
    return parseFloat(balanceEth).toFixed(4)
  } catch (error) {
    console.warn('Failed to fetch ETH balance:', error)
    return '0.0000'
  }
}

// Fetch USDC balance using viem contract
async function fetchUSDCBalance(address: string): Promise<string> {
  try {
    console.log('🔍 Fetching USDC balance for:', address)
    console.log('🔍 USDC contract address:', BASE_USDC)
    
    // Use readContract directly instead of getContract
    const balance = await publicClient.readContract({
      address: BASE_USDC,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    })
    
    console.log('💰 Raw USDC balance (BigInt):', balance)
    console.log('💰 Raw USDC balance (string):', balance.toString())
    console.log('💰 Raw USDC balance === 0n?', balance === 0n)
    
    // USDC has 6 decimals
    const balanceUsdc = formatUnits(balance, 6)
    console.log('💰 Formatted USDC balance:', balanceUsdc)
    console.log('💰 ParseFloat result:', parseFloat(balanceUsdc))
    
    const finalBalance = parseFloat(balanceUsdc).toFixed(2)
    console.log('💰 Final formatted balance:', finalBalance)
    
    return finalBalance
  } catch (error) {
    console.error('❌ Failed to fetch USDC balance:', error)
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
      console.log('🔍 Using Base USDC contract:', BASE_USDC)
      
      // Check what network the public client is actually using
      console.log('🔍 Public client chain ID:', publicClient.chain.id)

      // Fetch both balances in parallel
      const [ethBalance, usdcBalance] = await Promise.all([
        fetchETHBalance(walletAddress),
        fetchUSDCBalance(walletAddress),
      ])

      console.log('💰 Final ETH Balance:', ethBalance)
      console.log('💰 Final USDC Balance:', usdcBalance)

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