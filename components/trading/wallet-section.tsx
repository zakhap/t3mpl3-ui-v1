'use client'

import { useState, useEffect } from "react"
import { Wallet, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrivy } from '@privy-io/react-auth'
import BalanceDisplay from "@/components/balance-display"

interface WalletSectionProps {
  themeColor: string
}

export default function WalletSection({ themeColor }: WalletSectionProps) {
  const [mounted, setMounted] = useState(false)
  const [pressedButton, setPressedButton] = useState<string | null>(null)
  const { login, logout, authenticated, user } = usePrivy()
  
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
              className="w-full text-xs py-3 bg-black hover:text-black font-mono font-bold"
              style={{
                border: `2px solid ${themeColor}`,
                color: themeColor,
                boxShadow: pressedButton === 'connect' ? 'none' : `3px 3px 0px ${themeColor}`,
                transform: pressedButton === 'connect' ? 'translate(3px, 3px)' : 'translate(0, 0)',
              }}
              onMouseDown={() => handleButtonPress('connect')}
              onMouseEnter={(e) => (e.target.style.backgroundColor = themeColor)}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "black")}
            >
              <Wallet className="mr-2 h-3 w-3" />
              [CONNECT WALLET]
            </Button>
          </div>
        ) : (
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>NETWORK:</span>
              <span className="font-mono" style={{ color: themeColor }}>
                Connected
              </span>
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
              {user?.wallet?.address ? (
                <BalanceDisplay 
                  address={user.wallet.address} 
                  themeColor={themeColor}
                />
              ) : (
                <span className="font-mono">0.0000</span>
              )}
            </div>
            <Button
              onClick={logout}
              className="w-full text-xs py-3 bg-black mt-2 font-mono font-bold"
              style={{
                border: `2px solid ${themeColor}`,
                color: themeColor,
                backgroundColor: 'black',
                boxShadow: pressedButton === 'disconnect' ? 'none' : `3px 3px 0px ${themeColor}`,
                transform: pressedButton === 'disconnect' ? 'translate(3px, 3px)' : 'translate(0, 0)',
              }}
              onMouseDown={() => handleButtonPress('disconnect')}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = themeColor
                e.target.style.color = 'black'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'black'
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
