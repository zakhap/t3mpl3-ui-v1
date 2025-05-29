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
  const { login, logout, authenticated, user } = usePrivy()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!mounted) {
    return (
      <div className="p-4 mb-4" style={{ border: `1px solid ${themeColor}` }}>
        <div className="text-xs mb-2">WALLET CONNECTION</div>
        <div className="p-2" style={{ border: `1px solid ${themeColor}` }}>
          <div className="text-xs">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 mb-4" style={{ border: `1px solid ${themeColor}` }}>
      <div className="text-xs mb-2">
        {authenticated ? "WALLET INFORMATION" : "WALLET CONNECTION"}
      </div>
      <div className="p-2" style={{ border: `1px solid ${themeColor}` }}>
        {!authenticated ? (
          <div className="space-y-2">
            <Button
              onClick={login}
              className="w-full text-xs py-1 bg-black hover:text-black"
              style={{
                border: `1px solid ${themeColor}`,
                color: themeColor,
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = themeColor)}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "black")}
            >
              <Wallet className="mr-2 h-3 w-3" />
              CONNECT WALLET
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
              className="w-full text-xs py-1 bg-black hover:text-black mt-2"
              style={{
                border: `1px solid ${themeColor}`,
                color: themeColor,
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = themeColor)}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "black")}
            >
              DISCONNECT
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
