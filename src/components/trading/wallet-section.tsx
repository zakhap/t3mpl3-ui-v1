'use client'

import { useState, useEffect } from "react"

// TypeScript declarations for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, handler: (result: any) => void) => void
      removeListener: (event: string, handler: (result: any) => void) => void
    }
  }
}
import { Wallet, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrivy } from '@privy-io/react-auth'
import { useWalletBalancesWithState } from '@/hooks/use-wallet-balances'
import { useAccount, useChainId } from 'wagmi'

interface WalletSectionProps {
  themeColor: string
}

// SSR-safe hook for client-side rendering (from wagmi docs)
function useIsMounted() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return mounted
}

// Hook to capture the wallet's actual network before Privy forces it back
function useActualWalletNetwork() {
  const { chainId: accountChainId, chain, isConnected } = useAccount()
  const configChainId = useChainId()
  const { user, authenticated } = usePrivy()
  const [actualChainId, setActualChainId] = useState<number | null>(null)
  const [lastSeenChainId, setLastSeenChainId] = useState<number | null>(null)
  const [initialDetectionDone, setInitialDetectionDone] = useState(false)
  
  // Direct wallet network detection - bypasses Privy's initialization
  const detectWalletNetwork = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Method 1: eth_chainId (hex format)
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
        const chainIdFromHex = parseInt(chainIdHex, 16)
        console.log('🌐 [WALLET QUERY 1] eth_chainId:', { raw: chainIdHex, parsed: chainIdFromHex })

        // Method 2: net_version (string format)
        const netVersion = await window.ethereum.request({ method: 'net_version' })
        const chainIdFromNet = parseInt(netVersion, 10)
        console.log('🌐 [WALLET QUERY 2] net_version:', { raw: netVersion, parsed: chainIdFromNet })

        // Method 3: Direct property (if available)
        const directChainId = window.ethereum.chainId
        const chainIdFromDirect = directChainId ? parseInt(directChainId, 16) : null
        console.log('🌐 [WALLET QUERY 3] direct chainId:', { raw: directChainId, parsed: chainIdFromDirect })

        // Prioritize direct property since it's immediately available on page load
        const networkId = chainIdFromDirect || chainIdFromHex || chainIdFromNet
        console.log('🌐 [DIRECT WALLET QUERY] Final network detected (prioritizing direct property):', networkId)
        
        return networkId
      } catch (error) {
        console.log('🚨 [DIRECT WALLET QUERY] Error querying wallet:', error)
        return null
      }
    }
    return null
  }

  // Initial detection - query wallet directly on page load
  useEffect(() => {
    if (authenticated && !initialDetectionDone) {
      console.log('🎯 [NETWORK CAPTURE] Starting initial network detection', {
        authenticated,
        hasWindow: typeof window !== 'undefined',
        hasEthereum: typeof window !== 'undefined' && !!window.ethereum,
        accountChainId
      })
      
      // Small delay to ensure wallet is fully initialized
      setTimeout(() => {
        detectWalletNetwork().then(walletNetworkId => {
          if (walletNetworkId) {
            console.log('✅ [NETWORK CAPTURE] Direct wallet detection successful:', walletNetworkId)
            setActualChainId(walletNetworkId)
            if (walletNetworkId !== 8453) {
              setLastSeenChainId(walletNetworkId)
            }
            setInitialDetectionDone(true)
          } else if (accountChainId) {
            // Fallback to wagmi if direct query fails
            console.log('⚡ [NETWORK CAPTURE] Fallback to wagmi detection:', accountChainId)
            setActualChainId(accountChainId)
            if (accountChainId !== 8453) {
              setLastSeenChainId(accountChainId)
            }
            setInitialDetectionDone(true)
          } else {
            console.log('❌ [NETWORK CAPTURE] No network detected from either method')
          }
        }).catch(error => {
          console.log('🚨 [NETWORK CAPTURE] Error in detection:', error)
          // Still try wagmi fallback
          if (accountChainId) {
            setActualChainId(accountChainId)
            setInitialDetectionDone(true)
          }
        })
      }, 100) // 100ms delay
    }
  }, [authenticated, accountChainId, initialDetectionDone])

  // Network change detection effect
  useEffect(() => {
    if (initialDetectionDone && accountChainId && accountChainId !== actualChainId) {
      if (accountChainId !== 8453) {
        console.log('🚨 [NETWORK CAPTURE] Network switched to:', accountChainId)
        setActualChainId(accountChainId)
        setLastSeenChainId(accountChainId)
      } else if (lastSeenChainId && lastSeenChainId !== 8453) {
        console.log('🔄 [NETWORK CAPTURE] Forced back to Base, keeping:', lastSeenChainId)
        // Keep showing the non-Base network for a bit
      } else {
        // Genuinely switched to Base
        setActualChainId(8453)
      }
    }
  }, [accountChainId, actualChainId, lastSeenChainId, initialDetectionDone])
  
  // Listen for network changes in the wallet
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && authenticated) {
      const handleChainChanged = (chainId: string) => {
        const newChainId = parseInt(chainId, 16)
        console.log('🔄 [NETWORK LISTENER] Chain changed event detected:', newChainId)
        setActualChainId(newChainId)
        if (newChainId !== 8453) {
          setLastSeenChainId(newChainId)
        } else {
          // Successfully switched to Base, clear the last seen non-Base network
          setLastSeenChainId(null)
        }
      }

      // Add event listener for network changes
      window.ethereum.on('chainChanged', handleChainChanged)

      // Cleanup
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('chainChanged', handleChainChanged)
        }
      }
    }
  }, [authenticated])

  // Keep the detected network - don't auto-reset to Base
  // The direct wallet query is the source of truth for what network the user is actually on
  
  // Debug logging
  console.log('🔍 [NETWORK DEBUG]', {
    accountChainId,
    configChainId,
    actualChainId,
    lastSeenChainId,
    initialDetectionDone,
    isConnected,
    authenticated,
    chain: chain?.name,
    chainId: chain?.id,
    privyUser: user?.wallet?.address ? 'connected' : 'not connected',
    privyChainId: user?.wallet?.chainId,
  })
  
  const effectiveChainId = actualChainId || (isConnected ? accountChainId : configChainId)
  
  return {
    chainId: effectiveChainId,
    isSupported: !!chain || (actualChainId && actualChainId !== 8453), // Consider non-Base as supported for display
    isConnected,
    isUnsupported: isConnected && !chain && actualChainId === 8453,
    privyChainId: user?.wallet?.chainId,
    actualChainId,
  }
}

// Network display component - shows Base or Wrong Network
function NetworkDisplay({ themeColor }: { themeColor: string }) {
  const isMounted = useIsMounted()
  const { chainId, actualChainId } = useActualWalletNetwork()
  const { authenticated } = usePrivy()
  
  if (!isMounted) {
    return (
      <span className="font-mono" style={{ color: themeColor }}>
        Loading...
      </span>
    )
  }
  
  if (!authenticated) {
    return (
      <span className="font-mono" style={{ color: themeColor }}>
        Not Connected
      </span>
    )
  }
  
  // Use the actual detected network, with fallback to wagmi
  const detectedChainId = actualChainId || chainId
  
  console.log('🎯 [NETWORK DISPLAY]', {
    actualChainId,
    wagmiChainId: chainId,
    detectedChainId,
    authenticated,
    isBase: detectedChainId === 8453
  })
  
  // Simple logic: Base or Wrong Network
  if (detectedChainId === 8453) {
    return (
      <span className="font-mono" style={{ color: themeColor }}>
        Base (Mainnet)
      </span>
    )
  } else {
    return (
      <span className="font-mono" style={{ color: '#ff6b6b' }}>
        Wrong Network
      </span>
    )
  }
}

export default function WalletSection({ themeColor }: WalletSectionProps) {
  const [mounted, setMounted] = useState(false)
  const [pressedButton, setPressedButton] = useState<string | null>(null)
  const { login, logout, authenticated, user } = usePrivy()
  const { ethBalance, usdcBalance, loading: balancesLoading, formattedEth, formattedUsdc } = useWalletBalancesWithState()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleButtonPress = (buttonId: string) => {
    setPressedButton(buttonId)
    setTimeout(() => setPressedButton(null), 150)
  }
  
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!mounted) {
    return (
      <div className="p-4 mb-4">
        <div className="text-xs mb-2">WALLET CONNECTION</div>
        <div 
          className="p-2" 
          style={{ 
            border: `1px solid ${themeColor}`,
            boxShadow: `2px 2px 0px ${themeColor}`
          }}
        >
          <div className="text-xs">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 mb-4">
      <div className="text-xs mb-2">
        {authenticated ? "WALLET INFORMATION" : "WALLET CONNECTION"}
      </div>
      <div 
        className="p-2" 
        style={{ 
          border: `1px solid ${themeColor}`,
          boxShadow: `2px 2px 0px ${themeColor}`
        }}
      >
        {!authenticated ? (
          <div className="space-y-2">
            <Button
              onClick={login}
              className="w-full text-xs py-3 font-mono font-bold"
              style={{
                border: `2px solid ${themeColor}`,
                color: themeColor,
                backgroundColor: '#1c1c1c',
                boxShadow: pressedButton === 'connect' ? 'none' : `3px 3px 0px ${themeColor}`,
                transform: pressedButton === 'connect' ? 'translate(3px, 3px)' : 'translate(0, 0)',
              }}
              onMouseDown={() => handleButtonPress('connect')}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = themeColor
                e.target.style.color = '#1c1c1c'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#1c1c1c"
                e.target.style.color = themeColor
              }}
            >
              <Wallet className="mr-2 h-3 w-3" />
              [CONNECT WALLET]
            </Button>
          </div>
        ) : (
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>NETWORK:</span>
              <NetworkDisplay themeColor={themeColor} />
            </div>
            <div className="flex justify-between items-center">
              <span>ADDRESS:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono">
                  {user?.wallet?.address ? formatAddress(user.wallet.address) : 'N/A'}
                </span>
                {user?.wallet?.address && (
                  <button
                    onClick={() => navigator.clipboard.writeText(user.wallet.address)}
                    className="hover:opacity-70"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span>ETH BALANCE:</span>
              <span className="font-mono" style={{ color: themeColor }}>
                {balancesLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  formattedEth
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>USDC BALANCE:</span>
              <span className="font-mono" style={{ color: themeColor }}>
                {balancesLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  formattedUsdc
                )}
              </span>
            </div>
            <Button
              onClick={logout}
              className="w-full text-xs py-3 mt-2 font-mono font-bold"
              style={{
                border: `2px solid ${themeColor}`,
                color: themeColor,
                backgroundColor: '#1c1c1c',
                boxShadow: pressedButton === 'disconnect' ? 'none' : `3px 3px 0px ${themeColor}`,
                transform: pressedButton === 'disconnect' ? 'translate(3px, 3px)' : 'translate(0, 0)',
              }}
              onMouseDown={() => handleButtonPress('disconnect')}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = themeColor
                e.target.style.color = '#1c1c1c'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#1c1c1c'
                e.target.style.color = themeColor
              }}
            >
              [DISCONNECT]
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
