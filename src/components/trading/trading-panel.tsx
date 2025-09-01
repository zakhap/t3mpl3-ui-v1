'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePrivy } from '@privy-io/react-auth'
import { useBuySwap, useSellSwap, QuoteManager } from '@/lib/uniswap-v4'
import { usePublicClient } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'

interface TradingPanelProps {
  themeColor: string
  currentPrice: number
  activeTab: string
  setActiveTab: (tab: string) => void
  onMouseMove?: (e: React.MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function TradingPanel({
  themeColor,
  currentPrice,
  activeTab,
  setActiveTab,
  onMouseMove,
  onMouseEnter,
  onMouseLeave
}: TradingPanelProps) {
  const [buyAmount, setBuyAmount] = useState("")
  const [sellAmount, setSellAmount] = useState("")
  const [mounted, setMounted] = useState(false)
  const [pressedButton, setPressedButton] = useState<string | null>(null)
  const { authenticated } = usePrivy()
  
  // Only use wagmi hooks if mounted and authenticated
  const publicClient = mounted && authenticated ? usePublicClient() : null
  
  // Swap hooks with callbacks - only initialize if we have a client
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
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isConnected = mounted && authenticated

  const handleButtonPress = (buttonId: string) => {
    setPressedButton(buttonId)
    setTimeout(() => setPressedButton(null), 150)
  }
  
  // Handle buy transaction
  const handleBuy = async () => {
    if (!buyAmount || Number(buyAmount) <= 0) {
      toast.error('Please enter a valid ETH amount')
      return
    }
    
    if (!publicClient) {
      toast.error('Network not connected')
      return
    }
    
    try {
      // Get quote for minimum amount out (with 10% slippage tolerance)
      const quoteManager = new QuoteManager(publicClient)
      const quote = await quoteManager.getBuyQuote(buyAmount)
      
      if (!quote) {
        toast.error('Unable to get price quote')
        return
      }
      
      // Calculate minimum amount out with 10% slippage
      const slippagePercent = 10
      const minAmountOut = (quote.amountOut * BigInt(100 - slippagePercent)) / BigInt(100)
      
      await buySwap.executeBuy(buyAmount, minAmountOut, slippagePercent)
    } catch (error) {
      console.error('Buy error:', error)
      toast.error('Failed to execute buy transaction')
    }
  }
  
  // Handle sell transaction
  const handleSell = async () => {
    if (!sellAmount || Number(sellAmount) <= 0) {
      toast.error('Please enter a valid Temple amount')
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

  return (
    <div 
      className={`p-4 ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ 
        border: `2px double ${themeColor}`,
        boxShadow: `5px 5px 0px ${themeColor}`
      }}
      onMouseMove={!isConnected ? onMouseMove : undefined}
      onMouseEnter={!isConnected ? onMouseEnter : undefined}
      onMouseLeave={!isConnected ? onMouseLeave : undefined}
    >
      <div className="text-sm font-bold mb-2">TRADE ETH/TEMPLE</div>
      <div className="space-y-2">
        <Tabs 
          value={activeTab} 
          onValueChange={isConnected ? setActiveTab : undefined} 
          className="w-full"
        >
          <TabsList 
            className={`grid w-full grid-cols-2 ${!isConnected ? 'pointer-events-none' : ''}`}
            style={{ backgroundColor: '#1c1c1c', border: `1px solid ${themeColor}` }}
          >
            <TabsTrigger
              value="buy"
              className="data-[state=active]:text-black text-xs"
              style={{
                backgroundColor: activeTab === 'buy' ? 'rgba(139, 183, 137, 1)' : 'transparent',
                color: activeTab === 'buy' ? '#1c1c1c' : 'rgba(139, 183, 137, 1)'
              }}
              disabled={!isConnected}
            >
              BUY
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-black text-red-500 text-xs"
              disabled={!isConnected}
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
                      disabled={!isConnected}
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
                    TEMPLE
                  </div>
                  <div>
                    FEE: ~${buyAmount ? (Number.parseFloat(buyAmount) * currentPrice * 0.003).toFixed(2) : "0.00"}
                  </div>
                </div>
                <Button
                  className="w-full text-xs py-3 font-mono font-bold"
                  style={{
                    border: `2px solid ${themeColor}`,
                    color: themeColor,
                    backgroundColor: '#1c1c1c',
                    boxShadow: pressedButton === 'buy' ? 'none' : `3px 3px 0px ${themeColor}`,
                    transform: pressedButton === 'buy' ? 'translate(3px, 3px)' : 'translate(0, 0)',
                  }}
                  onMouseDown={() => handleButtonPress('buy')}
                  onMouseEnter={(e) => {
                    if (isConnected && !isTransacting) {
                      e.target.style.backgroundColor = themeColor
                      e.target.style.color = '#1c1c1c'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isConnected) {
                      e.target.style.backgroundColor = "#1c1c1c"
                      e.target.style.color = themeColor
                    }
                  }}
                  onClick={handleBuy}
                  disabled={!isConnected || isTransacting}
                >
                  {isBuying ? '[BUYING...]' : '[BUY TEMPLE]'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sell" className="space-y-2 mt-2">
            <div className="p-2" style={{ border: `1px solid ${themeColor}` }}>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="sell-amount" className="text-xs">
                    {'>'} AMOUNT (TEMPLE):
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
                      disabled={!isConnected}
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
                <Button
                  className="w-full text-xs py-3 font-mono font-bold"
                  style={{
                    border: `2px solid ${themeColor}`,
                    color: themeColor,
                    backgroundColor: '#1c1c1c',
                    boxShadow: pressedButton === 'sell' ? 'none' : `3px 3px 0px ${themeColor}`,
                    transform: pressedButton === 'sell' ? 'translate(3px, 3px)' : 'translate(0, 0)',
                  }}
                  onMouseDown={() => handleButtonPress('sell')}
                  onMouseEnter={(e) => {
                    if (isConnected && !isTransacting) {
                      e.target.style.backgroundColor = themeColor
                      e.target.style.color = '#1c1c1c'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isConnected) {
                      e.target.style.backgroundColor = "#1c1c1c"
                      e.target.style.color = themeColor
                    }
                  }}
                  onClick={handleSell}
                  disabled={!isConnected || isTransacting}
                >
                  {isSelling ? '[SELLING...]' : '[SELL TEMPLE]'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
