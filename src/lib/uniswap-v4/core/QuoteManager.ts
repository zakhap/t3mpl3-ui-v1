/**
 * QuoteManager - Handles price quoting for Uniswap V4 swaps
 */

import { PublicClient, parseEther } from "viem";
import { V4_QUOTER_ADDRESS, USDC_ADDRESS } from "../contracts/addresses";
import { QuoteParams, QuoteResult, PoolKey, POOL_CONSTANTS } from "../types";

// V4 Quoter ABI
const V4_QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: "currency0", type: "address" },
              { name: "currency1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" }
            ],
            name: "poolKey",
            type: "tuple"
          },
          { name: "zeroForOne", type: "bool" },
          { name: "exactAmount", type: "uint128" },
          { name: "hookData", type: "bytes" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "gasEstimate", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export class QuoteManager {
  private publicClient: PublicClient;

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient;
  }

  /**
   * Gets the standard ETH/USDC pool key
   */
  private getPoolKey(): PoolKey {
    return {
      currency0: POOL_CONSTANTS.ZERO_ADDRESS, // ETH
      currency1: USDC_ADDRESS,
      fee: POOL_CONSTANTS.FEE_TIER,
      tickSpacing: POOL_CONSTANTS.TICK_SPACING,
      hooks: POOL_CONSTANTS.ZERO_ADDRESS // No hooks
    };
  }

  /**
   * Gets a price quote for a swap
   */
  async getQuote(params: QuoteParams): Promise<QuoteResult | null> {
    try {
      const result = await this.publicClient.simulateContract({
        address: V4_QUOTER_ADDRESS,
        abi: V4_QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [params] as any
      });

      const [amountOut, gasEstimate] = result.result;
      
      return {
        amountOut,
        gasEstimate
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  }

  /**
   * Gets a quote for buying USDC with ETH
   */
  async getBuyQuote(amountIn: string): Promise<QuoteResult | null> {
    if (!amountIn || Number(amountIn) <= 0) {
      return null;
    }

    const poolKey = this.getPoolKey();
    const exactAmountInWei = parseEther(amountIn);

    const params: QuoteParams = {
      poolKey,
      zeroForOne: true, // ETH -> USDC
      exactAmount: exactAmountInWei,
      hookData: "0x"
    };

    return this.getQuote(params);
  }

  /**
   * Gets a quote for selling USDC for ETH
   */
  async getSellQuote(amountIn: string): Promise<QuoteResult | null> {
    if (!amountIn || Number(amountIn) <= 0) {
      return null;
    }

    const poolKey = this.getPoolKey();
    // For USDC input, parse as USDC (6 decimals)
    const exactAmountInWei = BigInt(Math.floor(Number(amountIn) * 1e6));

    const params: QuoteParams = {
      poolKey,
      zeroForOne: false, // USDC -> ETH
      exactAmount: exactAmountInWei,
      hookData: "0x"
    };

    return this.getQuote(params);
  }

  /**
   * Gets current ETH price in USDC
   */
  async getETHPrice(): Promise<number | null> {
    try {
      // Get quote for 1 ETH -> USDC
      const quote = await this.getBuyQuote("1");
      if (!quote) {
        return null;
      }

      // Convert USDC amount (6 decimals) to readable number
      const usdcAmount = Number(quote.amountOut) / 1e6;
      
      console.log('✅ V4 ETH price from Quoter:', usdcAmount);
      return usdcAmount;
    } catch (error) {
      console.error('Failed to get ETH price from V4:', error);
      return null;
    }
  }

  /**
   * Gets a quote based on trade direction
   */
  async getSwapQuote(amountIn: string, isBuying: boolean): Promise<QuoteResult | null> {
    if (isBuying) {
      return this.getBuyQuote(amountIn);
    } else {
      return this.getSellQuote(amountIn);
    }
  }

  /**
   * Continuously updates quotes (useful for real-time price updates)
   */
  createQuoteSubscription(
    amountIn: string,
    isBuying: boolean,
    onQuoteUpdate: (quote: QuoteResult | null) => void,
    intervalMs: number = 5000
  ): () => void {
    const updateQuote = async () => {
      const quote = await this.getSwapQuote(amountIn, isBuying);
      onQuoteUpdate(quote);
    };

    // Initial quote
    updateQuote();

    // Set up interval
    const interval = setInterval(updateQuote, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }
}