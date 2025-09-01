/**
 * useSwap - React hook for executing Uniswap V4 swaps
 */

import { useState, useCallback, useMemo } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { SwapManager } from '../core/SwapManager';
import { 
  SwapParams, 
  SwapResult, 
  SwapStatus,
  TradeType 
} from '../types';

interface UseSwapReturn {
  /** Execute a swap transaction */
  executeSwap: (params: SwapParams) => Promise<SwapResult>;
  /** Current swap status */
  swapStatus: SwapStatus;
  /** Whether a swap is currently in progress */
  isSwapping: boolean;
  /** Last swap result */
  lastResult: SwapResult | null;
  /** Reset swap state */
  reset: () => void;
}

interface UseSwapOptions {
  /** Callback fired when swap starts */
  onSwapStart?: (params: SwapParams) => void;
  /** Callback fired when swap succeeds */
  onSwapSuccess?: (result: SwapResult) => void;
  /** Callback fired when swap fails */
  onSwapError?: (error: string) => void;
  /** Callback fired when swap status changes */
  onStatusChange?: (status: SwapStatus) => void;
}

export function useSwap(options: UseSwapOptions = {}): UseSwapReturn {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [swapStatus, setSwapStatus] = useState<SwapStatus>(SwapStatus.PENDING);
  const [lastResult, setLastResult] = useState<SwapResult | null>(null);

  // Initialize swap manager
  const swapManager = useMemo(() => {
    if (!publicClient) return null;
    return new SwapManager(publicClient);
  }, [publicClient]);

  // Derived state
  const isSwapping = swapStatus === SwapStatus.CONFIRMING;

  // Update status and fire callback
  const updateStatus = useCallback((status: SwapStatus) => {
    setSwapStatus(status);
    options.onStatusChange?.(status);
  }, [options.onStatusChange]);

  // Execute swap function
  const executeSwap = useCallback(async (params: SwapParams): Promise<SwapResult> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (!swapManager) {
      throw new Error('Public client not available');
    }

    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    try {
      // Update status to confirming
      updateStatus(SwapStatus.CONFIRMING);
      options.onSwapStart?.(params);

      // Set wallet client for swap manager
      swapManager.setWalletClient(walletClient);

      // Execute the swap
      const result = await swapManager.executeSwap(params, address);
      setLastResult(result);

      if (result.success) {
        updateStatus(SwapStatus.SUCCESS);
        options.onSwapSuccess?.(result);
      } else {
        updateStatus(SwapStatus.FAILED);
        options.onSwapError?.(result.error || 'Swap failed');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failedResult: SwapResult = {
        hash: '0x0' as `0x${string}`,
        success: false,
        error: errorMessage
      };

      setLastResult(failedResult);
      updateStatus(SwapStatus.FAILED);
      options.onSwapError?.(errorMessage);

      return failedResult;
    }
  }, [address, swapManager, walletClient, updateStatus, options]);

  // Reset function
  const reset = useCallback(() => {
    setSwapStatus(SwapStatus.PENDING);
    setLastResult(null);
  }, []);

  return {
    executeSwap,
    swapStatus,
    isSwapping,
    lastResult,
    reset
  };
}

/**
 * Specialized hook for buy swaps (ETH -> Temple Token)
 */
export function useBuySwap(options: UseSwapOptions = {}) {
  const baseSwap = useSwap(options);

  const executeBuy = useCallback(
    async (amountIn: string, minAmountOut: bigint, slippagePercent: number = 10) => {
      const params: SwapParams = {
        tokenAddress: '0xE6BBfB40bAFe0Ec62eB687d5681C920B5d15FD17', // Temple Token on Sepolia
        amountIn,
        minAmountOut,
        isBuying: true,
        slippagePercent
      };

      return baseSwap.executeSwap(params);
    },
    [baseSwap.executeSwap]
  );

  return {
    ...baseSwap,
    executeBuy
  };
}

/**
 * Specialized hook for sell swaps (Temple Token -> ETH)
 */
export function useSellSwap(options: UseSwapOptions = {}) {
  const baseSwap = useSwap(options);

  const executeSell = useCallback(
    async (amountIn: string, minAmountOut: bigint, slippagePercent: number = 10) => {
      const params: SwapParams = {
        tokenAddress: '0xE6BBfB40bAFe0Ec62eB687d5681C920B5d15FD17', // Temple Token on Sepolia
        amountIn,
        minAmountOut,
        isBuying: false,
        slippagePercent
      };

      return baseSwap.executeSwap(params);
    },
    [baseSwap.executeSwap]
  );

  return {
    ...baseSwap,
    executeSell
  };
}