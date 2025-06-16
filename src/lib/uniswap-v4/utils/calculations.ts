/**
 * Calculation utilities for Uniswap V4 operations
 */

import { parseEther } from "viem";

/**
 * Calculate minimum amount out with slippage protection
 */
export function calculateMinAmountOut(expectedAmount: bigint, slippagePercent: number): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100)); // Convert to basis points
  const denominator = BigInt(10000);
  return (expectedAmount * (denominator - slippageBps)) / denominator;
}

/**
 * Parse amount string to Wei
 */
export function parseAmount(amount: string): bigint {
  try {
    return parseEther(amount);
  } catch {
    return BigInt(0);
  }
}

/**
 * Calculate gas limit with buffer
 */
export function calculateGasWithBuffer(gasEstimate: bigint, bufferPercent: number = 20): bigint {
  const buffer = BigInt(Math.floor(bufferPercent));
  return gasEstimate + (gasEstimate * buffer) / BigInt(100);
}

/**
 * Get swap direction for zeroForOne parameter
 */
export function getSwapDirection(isBuying: boolean): boolean {
  return isBuying; // ETH -> USDC = true (zeroForOne), USDC -> ETH = false
}

/**
 * Get swap direction from trade type
 */
export function getSwapDirectionFromTradeType(tradeType: string): boolean {
  return tradeType === 'buy';
}

/**
 * Create deadline timestamp (current time + minutes)
 */
export function createDeadline(minutes: number = 5): bigint {
  const now = Math.floor(Date.now() / 1000);
  return BigInt(now + (minutes * 60));
}