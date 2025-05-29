'use client'

import { useState } from 'react'
import { Wallet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConnect } from 'wagmi'

interface WalletConnectModalProps {
  themeColor: string
  onClose: () => void
}

export default function WalletConnectModal({ themeColor, onClose }: WalletConnectModalProps) {
  const { connect, connectors, isPending } = useConnect()
  
  const walletOptions = [
    {
      name: 'MetaMask',
      id: 'metaMask',
      icon: '🦊',
      description: 'Popular Ethereum wallet browser extension'
    },
    {
      name: 'Injected Wallet',
      id: 'injected',
      icon: '🔗',
      description: 'Any installed Web3 wallet'
    }
  ]

  const handleConnect = async (connectorId: string) => {
    try {
      const connector = connectors.find(c => c.id === 'injected')
      if (!connector) {
        console.error('No injected wallet found')
        alert('No wallet detected. Please install MetaMask or another Web3 wallet.')
        return
      }
      
      await connect({ connector })
      onClose()
    } catch (error: any) {
      console.error('Connection failed:', error)
      
      // Handle specific error types
      if (error?.message?.includes('User rejected')) {
        console.log('User cancelled connection')
      } else if (error?.message?.includes('No provider')) {
        alert('No wallet detected. Please install MetaMask or another Web3 wallet.')
      } else {
        console.error('Unknown connection error:', error)
        alert('Connection failed. Please try again or check your wallet.')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-black p-6 max-w-md w-full mx-4"
        style={{ border: `1px solid ${themeColor}` }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold" style={{ color: themeColor }}>
            CONNECT WALLET
          </h3>
          <button 
            onClick={onClose}
            className="hover:opacity-70"
            style={{ color: themeColor }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          {walletOptions.map((wallet) => (
            <Button
              key={wallet.id}
              onClick={() => handleConnect(wallet.id)}
              disabled={isPending}
              className="w-full text-left p-4 h-auto bg-black hover:text-black flex items-center gap-3"
              style={{
                border: `1px solid ${themeColor}`,
                color: themeColor,
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = themeColor)}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "black")}
            >
              <span className="text-lg">{wallet.icon}</span>
              <div>
                <div className="font-bold text-xs">{wallet.name}</div>
                <div className="text-xs opacity-70">{wallet.description}</div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="mt-4 text-xs opacity-70" style={{ color: themeColor }}>
          Don't have a wallet? Install MetaMask from metamask.io
        </div>
      </div>
    </div>
  )
}
