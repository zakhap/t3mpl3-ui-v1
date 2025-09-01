import { useQuery } from '@tanstack/react-query'
import { usePrivy } from '@privy-io/react-auth'
import { createPublicClient, http, getContract, formatEther, formatUnits } from 'viem'
import { sepolia } from 'viem/chains'

// Sepolia testnet contract addresses
const SEPOLIA_TEMPLE = '0xE6BBfB40bAFe0Ec62eB687d5681C920B5d15FD17' // Temple Token on Sepolia

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

// Create viem public client for Sepolia with Alchemy
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://eth-sepolia.g.alchemy.com/v2/g0r1SYyQzVqIv28OW67TTaMVGivvJ09Z'),
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
    return parseFloat(balanceEth).toFixed(6)
  } catch (error) {
    console.warn('Failed to fetch ETH balance:', error)
    return '0.000000'
  }
}

// Fetch Temple Token balance using viem contract
async function fetchTempleBalance(address: string): Promise<string> {
  try {
    console.log('🔍 Fetching Temple balance for:', address)
    console.log('🔍 Temple contract address:', SEPOLIA_TEMPLE)
    
    // Use readContract directly instead of getContract
    const balance = await publicClient.readContract({
      address: SEPOLIA_TEMPLE,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    })
    
    console.log('💰 Raw Temple balance (BigInt):', balance)
    console.log('💰 Raw Temple balance (string):', balance.toString())
    console.log('💰 Raw Temple balance === 0n?', balance === 0n)
    
    // Temple Token has 18 decimals (same as ETH)
    const balanceTemple = formatEther(balance)
    console.log('💰 Formatted Temple balance:', balanceTemple)
    console.log('💰 ParseFloat result:', parseFloat(balanceTemple))
    
    const finalBalance = parseFloat(balanceTemple).toFixed(18)
    console.log('💰 Final formatted balance:', finalBalance)
    
    return finalBalance
  } catch (error) {
    console.error('❌ Failed to fetch Temple balance:', error)
    return '0.000000000000000000'
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
      console.log('🔍 Using Sepolia Temple contract:', SEPOLIA_TEMPLE)
      
      // Check what network the public client is actually using
      console.log('🔍 Public client chain ID:', publicClient.chain.id)

      // Fetch both balances in parallel
      const [ethBalance, templeBalance] = await Promise.all([
        fetchETHBalance(walletAddress),
        fetchTempleBalance(walletAddress),
      ])

      console.log('💰 Final ETH Balance:', ethBalance)
      console.log('💰 Final Temple Balance:', templeBalance)

      return {
        eth: ethBalance,
        temple: templeBalance,
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
    ethBalance: data?.eth || '0.000000',
    templeBalance: data?.temple || '0.000000000000000000',
    loading: isLoading,
    error: isError ? error : null,
    connected: authenticated,
    refetch,
    // Formatted for display
    formattedEth: data?.eth ? `${data.eth} ETH` : '0.000000 ETH',
    formattedTemple: data?.temple ? `${data.temple} TEMPLE` : '0.000000000000000000 TEMPLE',
  }
}