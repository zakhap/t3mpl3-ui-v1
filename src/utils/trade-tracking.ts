/**
 * Utility functions for tracking trades and tax write-off countdown
 */

/**
 * Store the timestamp of a user's last trade in localStorage
 * @param walletAddress - The user's wallet address (used as salt for localStorage key)
 */
export function recordLastTrade(walletAddress: string): void {
  if (!walletAddress) return
  
  const storageKey = `lastTrade_${walletAddress.toLowerCase()}`
  const timestamp = Date.now().toString()
  
  try {
    localStorage.setItem(storageKey, timestamp)
    console.log(`Recorded trade for ${walletAddress}: ${new Date(Date.now()).toISOString()}`)
  } catch (error) {
    console.warn('Failed to store last trade timestamp:', error)
  }
}

/**
 * Get the last trade timestamp for a user
 * @param walletAddress - The user's wallet address
 * @returns The timestamp as a number, or null if no trade recorded
 */
export function getLastTrade(walletAddress: string): number | null {
  if (!walletAddress) return null
  
  const storageKey = `lastTrade_${walletAddress.toLowerCase()}`
  
  try {
    const timestamp = localStorage.getItem(storageKey)
    return timestamp ? parseInt(timestamp) : null
  } catch (error) {
    console.warn('Failed to retrieve last trade timestamp:', error)
    return null
  }
}

/**
 * Calculate days remaining until maximum tax write-off eligibility (1 year)
 * @param walletAddress - The user's wallet address
 * @returns Number of days remaining, 0 if complete, or null if no trade recorded
 */
export function calculateDaysToMaxWriteOff(walletAddress: string): number | null {
  const lastTradeTimestamp = getLastTrade(walletAddress)
  
  if (!lastTradeTimestamp) return null
  
  const lastTradeDate = new Date(lastTradeTimestamp)
  const oneYearLater = new Date(lastTradeDate)
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
  
  const now = new Date()
  const timeDiff = oneYearLater.getTime() - now.getTime()
  
  if (timeDiff <= 0) {
    return 0 // Already passed 1 year - maximum write-off achieved
  }
  
  const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  return daysLeft
}

/**
 * Demo function to set a fake last trade for testing purposes
 * @param walletAddress - The user's wallet address
 * @param daysAgo - Number of days ago to set the trade (default: 30 days)
 */
export function setDemoLastTrade(walletAddress: string, daysAgo: number = 30): void {
  if (!walletAddress) return
  
  const storageKey = `lastTrade_${walletAddress.toLowerCase()}`
  const timestamp = (Date.now() - (daysAgo * 24 * 60 * 60 * 1000)).toString()
  
  try {
    localStorage.setItem(storageKey, timestamp)
    console.log(`Set demo trade for ${walletAddress}: ${daysAgo} days ago`)
  } catch (error) {
    console.warn('Failed to store demo trade timestamp:', error)
  }
}