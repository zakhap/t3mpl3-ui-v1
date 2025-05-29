'use client'

import { useState, useEffect } from "react"
import { usePrivy } from '@privy-io/react-auth'

interface BalanceDisplayProps {
  address: string
  themeColor: string
}

export default function BalanceDisplay({ address, themeColor }: BalanceDisplayProps) {
  const [balance, setBalance] = useState<string>('Loading...')

  useEffect(() => {
    if (!address) return

    const fetchBalance = async () => {
      try {
        // Use a public RPC to get balance
        const response = await fetch('https://eth-mainnet.public.blastapi.io', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
          }),
        })

        const data = await response.json()
        if (data.result) {
          // Convert from wei to ETH
          const balanceInWei = BigInt(data.result)
          const balanceInEth = Number(balanceInWei) / Math.pow(10, 18)
          setBalance(balanceInEth.toFixed(4))
        } else {
          setBalance('0.0000')
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error)
        setBalance('0.0000')
      }
    }

    fetchBalance()
  }, [address])

  return (
    <span className="font-mono">
      {balance}
    </span>
  )
}
