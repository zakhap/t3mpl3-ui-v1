'use client'

import { useState, useEffect } from "react"

// TypeScript declarations for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      chainId?: string
      request: (args: { method: string; params?: any[] }) => Promise<any>
    }
  }
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBuySwap, useSellSwap, QuoteManager } from '@/lib/uniswap-v4'
import { usePublicClient, useAccount, useChainId } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { base } from 'wagmi/chains'
import { toast } from 'sonner'


interface TradingPanelInnerProps {
  themeColor: string
  currentPrice: number
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function TradingPanelInner({
  themeColor,
  currentPrice,
  activeTab,
  setActiveTab
}: TradingPanelInnerProps) {
  const [buyAmount, setBuyAmount] = useState("")
  const [sellAmount, setSellAmount] = useState("")
  const [pressedButton, setPressedButton] = useState<string | null>(null)
  const [actualChainId, setActualChainId] = useState<number | null>(null)
  const publicClient = usePublicClient()
  const { user, authenticated } = usePrivy()
  const { chainId: accountChainId } = useAccount()

  // Network detection - same logic as wallet-section but simplified
  useEffect(() => {
    if (authenticated && typeof window !== 'undefined' && window.ethereum) {
      const detectNetwork = async () => {
        try {
          const directChainId = window.ethereum.chainId
          if (directChainId) {
            const networkId = parseInt(directChainId, 16)
            setActualChainId(networkId)
          } else if (accountChainId) {
            setActualChainId(accountChainId)
          }
        } catch (error) {
          console.log('Network detection error:', error)
          if (accountChainId) {
            setActualChainId(accountChainId)
          }
        }
      }
      detectNetwork()
    }
  }, [authenticated, accountChainId])

  // Check if user is on wrong network
  const isOnWrongNetwork = actualChainId !== null && actualChainId !== 8453
  const isNetworkDisabled = isOnWrongNetwork
  
  // Network switching state
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  
  // Switch to Base network
  const switchToBase = async () => {
    if (!window.ethereum) {
      toast.error('Wallet not detected')
      return
    }
    
    setIsSwitchingNetwork(true)
    
    try {
      // Request network switch to Base (0x2105 = 8453 in hex)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }],
      })
      
      // Wait a moment for the network to switch, then re-detect
      setTimeout(() => {
        if (window.ethereum?.chainId) {
          const newChainId = parseInt(window.ethereum.chainId, 16)
          setActualChainId(newChainId)
        }
        setIsSwitchingNetwork(false)
      }, 1000)
      
      toast.success('Switched to Base network')
    } catch (error: any) {
      console.error('Network switch error:', error)
      
      // If the network doesn't exist in wallet, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          })
          toast.success('Base network added and switched')
        } catch (addError) {
          console.error('Add network error:', addError)
          toast.error('Failed to add Base network')
        }
      } else {
        toast.error('Failed to switch network')
      }
      
      setIsSwitchingNetwork(false)
    }
  }
  
  // Swap hooks with callbacks
  const buySwap = useBuySwap({
    onSwapStart: () => {
      toast.info('Initiating buy transaction...')
    },
    onSwapSuccess: (result) => {
      toast.success(`Buy successful! Transaction: ${result.hash.slice(0, 8)}...`)
      setBuyAmount('')
    },
    onSwapError: (error) => {
      toast.error(`Buy failed: ${error}`)
    }
  })
  
  const sellSwap = useSellSwap({
    onSwapStart: () => {
      toast.info('Initiating sell transaction...')
    },
    onSwapSuccess: (result) => {
      toast.success(`Sell successful! Transaction: ${result.hash.slice(0, 8)}...`)
      setSellAmount('')
    },
    onSwapError: (error) => {
      toast.error(`Sell failed: ${error}`)
    }
  })

  const handleButtonPress = (buttonId: string) => {
    setPressedButton(buttonId)
    setTimeout(() => setPressedButton(null), 150)
  }

  
  // Handle buy transaction
  const handleBuy = async () => {
    console.log('🛒 [UI DEBUG] BUY button clicked - starting buy process:', {
      timestamp: new Date().toISOString(),
      buyAmount,
      publicClientExists: !!publicClient,
      walletConnected: !!user?.wallet?.address,
      environment: {
        nodeEnv: typeof window !== 'undefined' ? 'browser' : 'server',
        viteMode: import.meta.env?.MODE,
        isProduction: import.meta.env?.PROD
      }
    });

    if (!buyAmount || Number(buyAmount) <= 0) {
      console.error('❌ [UI DEBUG] Invalid buy amount:', buyAmount);
      toast.error('Please enter a valid ETH amount')
      return
    }
    
    if (!publicClient) {
      console.error('❌ [UI DEBUG] No public client available');
      toast.error('Network not connected')
      return
    }
    
    try {
      // Get current chain ID for debugging
      const chainId = await publicClient.getChainId();
      console.log('🔗 [UI DEBUG] Current chain ID:', chainId);
      
      // Get quote for minimum amount out (with 10% slippage tolerance)
      console.log('📊 [UI DEBUG] Creating QuoteManager and requesting buy quote...');
      const quoteManager = new QuoteManager(publicClient)
      const quote = await quoteManager.getBuyQuote(buyAmount)
      
      if (!quote) {
        console.error('❌ [UI DEBUG] Failed to get quote from QuoteManager');
        toast.error('Unable to get price quote')
        return
      }
      
      console.log('📊 [UI DEBUG] Quote received successfully:', {
        amountOut: quote.amountOut.toString(),
        gasEstimate: quote.gasEstimate.toString()
      });
      
      // Calculate minimum amount out with 10% slippage
      const slippagePercent = 10
      const minAmountOut = (quote.amountOut * BigInt(100 - slippagePercent)) / BigInt(100)
      
      console.log('💰 [UI DEBUG] Starting buy swap execution with:', {
        buyAmount,
        minAmountOut: minAmountOut.toString(),
        slippagePercent
      });
      
      await buySwap.executeBuy(buyAmount, minAmountOut, slippagePercent)
    } catch (error) {
      console.error('Buy error:', error)
      toast.error('Failed to execute buy transaction')
    }
  }
  
  // Handle sell transaction
  const handleSell = async () => {
    if (!sellAmount || Number(sellAmount) <= 0) {
      toast.error('Please enter a valid USDC amount')
      return
    }
    
    if (!publicClient) {
      toast.error('Network not connected')
      return
    }
    
    try {
      // Get quote for minimum amount out (with 10% slippage tolerance)
      const quoteManager = new QuoteManager(publicClient)
      const quote = await quoteManager.getSellQuote(sellAmount)
      
      if (!quote) {
        toast.error('Unable to get price quote')
        return
      }
      
      // Calculate minimum amount out with 10% slippage
      const slippagePercent = 10
      const minAmountOut = (quote.amountOut * BigInt(100 - slippagePercent)) / BigInt(100)
      
      await sellSwap.executeSell(sellAmount, minAmountOut, slippagePercent)
    } catch (error) {
      console.error('Sell error:', error)
      toast.error('Failed to execute sell transaction')
    }
  }
  
  // Check if transactions are in progress
  const isBuying = buySwap.isSwapping
  const isSelling = sellSwap.isSwapping
  const isTransacting = isBuying || isSelling
  
  // Disable buttons if on wrong network or transacting
  const isButtonDisabled = isTransacting || isNetworkDisabled


  return (
    <div 
      className="p-4"
      style={{ 
        border: `2px double ${themeColor}`,
        boxShadow: `5px 5px 0px ${themeColor}`
      }}
    >
      <div className="text-sm font-bold mb-2">TRADE ETH/USDC</div>
      <div className="space-y-2">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList 
            className="grid w-full grid-cols-2"
            style={{ backgroundColor: '#1c1c1c', border: `1px solid ${themeColor}` }}
          >
            <TabsTrigger
              value="buy"
              className="data-[state=active]:text-black text-xs"
              style={{
                backgroundColor: activeTab === 'buy' ? 'rgba(139, 183, 137, 1)' : 'transparent',
                color: activeTab === 'buy' ? '#1c1c1c' : 'rgba(139, 183, 137, 1)'
              }}
            >
              BUY
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-black text-red-500 text-xs"
            >
              SELL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-2 mt-2">
            <div className="p-2" style={{ border: `1px solid ${themeColor}` }}>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="buy-amount" className="text-xs">
                    {'>'} AMOUNT (ETH):
                  </Label>
                  <div className="relative">
                    <Input
                      id="buy-amount"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      placeholder="0.0000"
                      className="text-xs h-10 font-mono pl-6"
                      style={{
                        border: `2px solid ${themeColor}`,
                        color: themeColor,
                        backgroundColor: '#2a2a2a',
                        caretColor: themeColor,
                        outline: 'none',
                      }}
                      disabled={isTransacting}
                    />
                    <span 
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-mono pointer-events-none"
                      style={{ color: themeColor }}
                    >
                      {'>'}
                    </span>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    RECEIVE: ~{buyAmount ? (Number.parseFloat(buyAmount) * currentPrice).toFixed(2) : "0.00"}{" "}
                    USDC
                  </div>
                  <div>
                    FEE: ~${buyAmount ? (Number.parseFloat(buyAmount) * currentPrice * 0.003).toFixed(2) : "0.00"}
                  </div>
                </div>
                
                {isOnWrongNetwork && (
                  <Button
                    onClick={switchToBase}
                    disabled={isSwitchingNetwork}
                    className="w-full text-xs py-2 font-mono font-bold mb-2"
                    style={{
                      border: '2px solid #ff6b6b',
                      color: '#ff6b6b',
                      backgroundColor: '#1c1c1c',
                      boxShadow: isSwitchingNetwork ? 'none' : '3px 3px 0px #ff6b6b',
                      transform: isSwitchingNetwork ? 'translate(3px, 3px)' : 'translate(0, 0)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSwitchingNetwork) {
                        e.target.style.backgroundColor = '#ff6b6b'
                        e.target.style.color = '#1c1c1c'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#1c1c1c'
                      e.target.style.color = '#ff6b6b'
                    }}
                  >
                    {isSwitchingNetwork ? '[SWITCHING...]' : '[SWITCH TO BASE NETWORK]'}
                  </Button>
                )}
                
                <Button
                  className="w-full text-xs py-3 font-mono font-bold"
                  style={{
                    border: `2px solid ${isNetworkDisabled ? '#666' : themeColor}`,
                    color: isNetworkDisabled ? '#666' : themeColor,
                    backgroundColor: '#1c1c1c',
                    boxShadow: pressedButton === 'buy' ? 'none' : `3px 3px 0px ${isNetworkDisabled ? '#666' : themeColor}`,
                    transform: pressedButton === 'buy' ? 'translate(3px, 3px)' : 'translate(0, 0)',
                    cursor: isNetworkDisabled ? 'not-allowed' : 'pointer',
                  }}
                  onMouseDown={() => !isNetworkDisabled && handleButtonPress('buy')}
                  onMouseEnter={(e) => {
                    if (!isNetworkDisabled) {
                      e.target.style.backgroundColor = themeColor
                      e.target.style.color = '#1c1c1c'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#1c1c1c"
                    e.target.style.color = isNetworkDisabled ? '#666' : themeColor
                  }}
                  onClick={handleBuy}
                  disabled={isNetworkDisabled || isTransacting}
                >
                  {isBuying ? '[BUYING...]' : '[BUY USDC]'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sell" className="space-y-2 mt-2">
            <div className="p-2" style={{ border: `1px solid ${themeColor}` }}>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="sell-amount" className="text-xs">
                    {'>'} AMOUNT (USDC):
                  </Label>
                  <div className="relative">
                    <Input
                      id="sell-amount"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      placeholder="0"
                      className="text-xs h-10 font-mono pl-6"
                      style={{
                        border: `2px solid ${themeColor}`,
                        color: themeColor,
                        backgroundColor: '#2a2a2a',
                        caretColor: themeColor,
                        outline: 'none',
                      }}
                      disabled={isTransacting}
                    />
                    <span 
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-mono pointer-events-none"
                      style={{ color: themeColor }}
                    >
                      {'>'}
                    </span>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    RECEIVE: ~
                    {sellAmount ? (Number.parseFloat(sellAmount) / currentPrice).toFixed(6) : "0.000000"} ETH
                  </div>
                  <div>
                    FEE: ~$
                    {sellAmount
                      ? (Number.parseFloat(sellAmount) * 0.003).toFixed(2)
                      : "0.00"}
                  </div>
                </div>
                
                {isOnWrongNetwork && (
                  <Button
                    onClick={switchToBase}
                    disabled={isSwitchingNetwork}
                    className="w-full text-xs py-2 font-mono font-bold mb-2"
                    style={{
                      border: '2px solid #ff6b6b',
                      color: '#ff6b6b',
                      backgroundColor: '#1c1c1c',
                      boxShadow: isSwitchingNetwork ? 'none' : '3px 3px 0px #ff6b6b',
                      transform: isSwitchingNetwork ? 'translate(3px, 3px)' : 'translate(0, 0)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSwitchingNetwork) {
                        e.target.style.backgroundColor = '#ff6b6b'
                        e.target.style.color = '#1c1c1c'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#1c1c1c'
                      e.target.style.color = '#ff6b6b'
                    }}
                  >
                    {isSwitchingNetwork ? '[SWITCHING...]' : '[SWITCH TO BASE NETWORK]'}
                  </Button>
                )}
                
                <Button
                  className="w-full text-xs py-3 font-mono font-bold"
                  style={{
                    border: `2px solid ${isNetworkDisabled ? '#666' : themeColor}`,
                    color: isNetworkDisabled ? '#666' : themeColor,
                    backgroundColor: '#1c1c1c',
                    boxShadow: pressedButton === 'sell' ? 'none' : `3px 3px 0px ${isNetworkDisabled ? '#666' : themeColor}`,
                    transform: pressedButton === 'sell' ? 'translate(3px, 3px)' : 'translate(0, 0)',
                    cursor: isNetworkDisabled ? 'not-allowed' : 'pointer',
                  }}
                  onMouseDown={() => !isNetworkDisabled && handleButtonPress('sell')}
                  onMouseEnter={(e) => {
                    if (!isNetworkDisabled) {
                      e.target.style.backgroundColor = themeColor
                      e.target.style.color = '#1c1c1c'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#1c1c1c"
                    e.target.style.color = isNetworkDisabled ? '#666' : themeColor
                  }}
                  onClick={handleSell}
                  disabled={isNetworkDisabled || isTransacting}
                >
                  {isSelling ? '[SELLING...]' : '[SELL USDC]'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}