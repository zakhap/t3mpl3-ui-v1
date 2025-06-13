"use client"

import { useState } from "react"
import Ticker from "@/components/trading/ticker"
import Header from "@/components/trading/header"
import WalletSection from "@/components/trading/wallet-section"
import PriceDisplay from "@/components/trading/price-display"
import TradingPanel from "@/components/trading/trading-panel"

export default function T3MPL3Trading() {
  const [activeTab, setActiveTab] = useState("buy")
  const [showTooltip, setShowTooltip] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const currentPrice = 0.0028
  const holders = 1337
  const templeFund = 234567

  const isRedMode = activeTab === "sell"
  const themeColor = isRedMode ? "#cc7744" : "#44cc77"
  const themeBg = isRedMode ? "bg-red-500" : "bg-green-500"

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  return (
    <div className="min-h-screen terminal-bg" style={{ color: themeColor }}>
      {/* Tooltip for disabled trading */}
      {showTooltip && (
        <div
          className="fixed z-50 pointer-events-none text-xs px-2 py-1 border"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y - 25,
            backgroundColor: '#1c1c1c',
            border: `1px solid ${themeColor}`,
            color: themeColor,
          }}
        >
          MUST CONNECT WALLET
        </div>
      )}

      <Ticker themeColor={themeColor} themeBg={themeBg} />

      <div className="container mx-auto p-4 max-w-4xl">
        <Header themeColor={themeColor} />
        
        <WalletSection themeColor={themeColor} />

        {/* Top Row: Current Price + Trading Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div 
            className="p-4 self-start" 
            style={{ 
              border: `1px solid ${themeColor}`,
              boxShadow: `4px 4px 0px ${themeColor}`
            }}
          >
            <PriceDisplay themeColor={themeColor} currentPrice={currentPrice} />
            
            {/* Statistics underneath current price */}
            <div className="mt-4">
              <div className="text-xs mb-2">STATISTICS</div>
              <div 
                className="p-2" 
                style={{ 
                  border: `1px solid ${themeColor}`,
                  boxShadow: `2px 2px 0px ${themeColor}`
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs">HOLDERS:</span>
                    <span className="text-sm">{holders.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">TEMPLE FUND:</span>
                    <span className="text-sm">${templeFund.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <TradingPanel
            themeColor={themeColor}
            currentPrice={currentPrice}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
        </div>

        {/* Info Section */}
        <div 
          className="p-4 mt-4" 
          style={{ 
            border: `1px solid ${themeColor}`,
            boxShadow: `4px 4px 0px ${themeColor}`
          }}
        >
          <div className="text-xs mb-2">SYSTEM INFORMATION</div>
          <div 
            className="p-2" 
            style={{ 
              border: `1px solid ${themeColor}`,
              boxShadow: `2px 2px 0px ${themeColor}`
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="mb-2">► TAX DEDUCTIONS:</div>
                <div className="ml-4 mb-2">TRADING FEES BECOME CHARITABLE DONATIONS</div>

                <div className="mb-2">► HISTORIC BUILDING:</div>
                <div className="ml-4 mb-2">BUYING A 200-YEAR-OLD BROOKLYN TEMPLE</div>
              </div>
              <div>
                <div className="mb-2">► FINANCIAL INNOVATION:</div>
                <div className="ml-4 mb-2">SUBVERTING TRADITIONAL FUNDRAISING</div>

                <div className="mb-2">► MISSION:</div>
                <div className="ml-4 mb-2">"THIS MEME IS A WRITE-OFF, BUT DON'T WRITE IT OFF."</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="p-2 mt-4" 
          style={{ 
            border: `1px solid ${themeColor}`,
            boxShadow: `3px 3px 0px ${themeColor}`
          }}
        >
          <div className="text-center text-xs">
            <span>TRADING FEES DONATED TO </span>
            <span style={{ color: themeColor }}>QUBIT</span>
            <span>, A NYC-BASED NON-PROFIT</span>
            <span className="blink ml-2">█</span>
          </div>
        </div>
      </div>
    </div>
  )
}