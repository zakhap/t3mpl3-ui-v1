import { useState, useEffect } from 'react'

interface TaxInfoProps {
  themeColor: string
  templeBalance: number
  walletAddress?: string
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isComplete: boolean
}

export default function TaxInfo({ themeColor, templeBalance, walletAddress }: TaxInfoProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  
  useEffect(() => {
    if (!walletAddress || templeBalance <= 0) {
      setTimeRemaining(null)
      return
    }

    // Get last trade timestamp from localStorage
    const storageKey = `lastTrade_${walletAddress.toLowerCase()}`
    const lastTradeTimestamp = localStorage.getItem(storageKey)
    
    if (!lastTradeTimestamp) {
      setTimeRemaining(null)
      return
    }

    // Calculate detailed time remaining until 1 year
    const calculateTimeRemaining = (): TimeRemaining => {
      const lastTradeDate = new Date(parseInt(lastTradeTimestamp))
      const oneYearLater = new Date(lastTradeDate)
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
      
      const now = new Date()
      const timeDiff = oneYearLater.getTime() - now.getTime()
      
      if (timeDiff <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isComplete: true
        }
      }
      
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
      
      return {
        days,
        hours,
        minutes,
        seconds,
        isComplete: false
      }
    }

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining())

    // Update countdown every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining())
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [walletAddress, templeBalance])

  if (templeBalance <= 0) {
    return null
  }

  return (
    <div className="px-4 pb-4 -mt-2">
      <div className="text-xs mb-2">TAX INFORMATION</div>
      <div 
        className="p-2" 
        style={{ 
          border: `1px solid ${themeColor}`,
          boxShadow: `2px 2px 0px ${themeColor}`
        }}
      >
        <div className="text-xs">
          ⚠ Holding TEMPLE for more than 1 year changes the status of the tax implication from short to long term
        </div>
        {timeRemaining !== null && (
          <div 
            className="mt-3 p-2 text-center" 
            style={{ 
              border: `1px solid ${themeColor}`,
              boxShadow: `1px 1px 0px ${themeColor}`,
              backgroundColor: '#1a1a1a'
            }}
          >
            <div className="text-xs font-bold" style={{ color: themeColor }}>
              {timeRemaining.isComplete 
                ? 'MAXIMUM WRITE-OFF: COMPLETE ✓' 
                : `TIME UNTIL MAXIMUM WRITE-OFF:`
              }
            </div>
            {!timeRemaining.isComplete && (
              <div className="text-sm font-mono mt-1" style={{ color: themeColor }}>
                {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}