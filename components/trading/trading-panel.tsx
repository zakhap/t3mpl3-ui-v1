'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePrivy } from '@privy-io/react-auth'

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
  const { authenticated } = usePrivy()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isConnected = mounted && authenticated

  return (
    <div 
      className={`p-4 ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ border: `1px solid ${themeColor}` }}
      onMouseMove={!isConnected ? onMouseMove : undefined}
      onMouseEnter={!isConnected ? onMouseEnter : undefined}
      onMouseLeave={!isConnected ? onMouseLeave : undefined}
    >
      <div className="text-xs mb-2">TRADE $T3MPL3</div>
      <div className="space-y-2">
        <Tabs 
          value={activeTab} 
          onValueChange={isConnected ? setActiveTab : undefined} 
          className="w-full"
        >
          <TabsList 
            className={`grid w-full grid-cols-2 bg-black ${!isConnected ? 'pointer-events-none' : ''}`}
            style={{ border: `1px solid ${themeColor}` }}
          >
            <TabsTrigger
              value="buy"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black text-green-500 text-xs"
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
                    AMOUNT (ETH):
                  </Label>
                  <Input
                    id="buy-amount"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder="0.0000"
                    className="text-xs h-8 bg-black font-mono"
                    style={{
                      border: `1px solid ${themeColor}`,
                      color: themeColor,
                    }}
                    disabled={!isConnected}
                  />
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    RECEIVE: ~{buyAmount ? (Number.parseFloat(buyAmount) / currentPrice).toFixed(0) : "0"}{" "}
                    $T3MPL3
                  </div>
                  <div>
                    DONATION: ~${buyAmount ? (Number.parseFloat(buyAmount) * 0.003 * 3000).toFixed(2) : "0.00"}
                  </div>
                </div>
                <Button
                  className="w-full text-xs py-1 bg-black hover:text-black"
                  style={{
                    border: `1px solid ${themeColor}`,
                    color: themeColor,
                  }}
                  onMouseEnter={(e) => isConnected && (e.target.style.backgroundColor = themeColor)}
                  onMouseLeave={(e) => isConnected && (e.target.style.backgroundColor = "black")}
                  disabled={!isConnected}
                >
                  EXECUTE BUY
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sell" className="space-y-2 mt-2">
            <div className="p-2" style={{ border: `1px solid ${themeColor}` }}>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="sell-amount" className="text-xs">
                    AMOUNT ($T3MPL3):
                  </Label>
                  <Input
                    id="sell-amount"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="0"
                    className="text-xs h-8 bg-black font-mono"
                    style={{
                      border: `1px solid ${themeColor}`,
                      color: themeColor,
                    }}
                    disabled={!isConnected}
                  />
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    RECEIVE: ~
                    {sellAmount ? (Number.parseFloat(sellAmount) * currentPrice).toFixed(4) : "0.0000"} ETH
                  </div>
                  <div>
                    DONATION: ~$
                    {sellAmount
                      ? (Number.parseFloat(sellAmount) * currentPrice * 0.003 * 3000).toFixed(2)
                      : "0.00"}
                  </div>
                </div>
                <Button
                  className="w-full text-xs py-1 bg-black hover:text-black"
                  style={{
                    border: `1px solid ${themeColor}`,
                    color: themeColor,
                  }}
                  onMouseEnter={(e) => isConnected && (e.target.style.backgroundColor = themeColor)}
                  onMouseLeave={(e) => isConnected && (e.target.style.backgroundColor = "black")}
                  disabled={!isConnected}
                >
                  EXECUTE SELL
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
