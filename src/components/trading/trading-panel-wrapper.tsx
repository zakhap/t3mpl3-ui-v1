'use client'

import { useState, useEffect } from "react"
import { usePrivy } from '@privy-io/react-auth'
import TradingPanelInner from './trading-panel-inner'

interface TradingPanelProps {
  themeColor: string
  currentPrice: number
  activeTab: string
  setActiveTab: (tab: string) => void
  onMouseMove?: (e: React.MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function TradingPanel(props: TradingPanelProps) {
  const [mounted, setMounted] = useState(false)
  const { authenticated } = usePrivy()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isConnected = mounted && authenticated

  if (!mounted) {
    return (
      <div 
        className="p-4 opacity-50 cursor-not-allowed"
        style={{ 
          border: `2px double ${props.themeColor}`,
          boxShadow: `5px 5px 0px ${props.themeColor}`
        }}
      >
        <div className="text-sm font-bold mb-2">TRADE ETH/USDC</div>
        <div className="text-xs">Loading...</div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div 
        className="p-4 opacity-50 cursor-not-allowed"
        style={{ 
          border: `2px double ${props.themeColor}`,
          boxShadow: `5px 5px 0px ${props.themeColor}`
        }}
        onMouseMove={props.onMouseMove}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
      >
        <div className="text-sm font-bold mb-2">TRADE ETH/USDC</div>
        <div className="text-xs">Please connect your wallet to trade</div>
      </div>
    )
  }

  return <TradingPanelInner {...props} />
}