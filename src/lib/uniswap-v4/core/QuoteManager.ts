/**
 * QuoteManager - Handles price quoting for Uniswap V4 swaps
 */

import { PublicClient, parseEther } from "viem";
import { V4_QUOTER_ADDRESS, TEMPLE_TOKEN_ADDRESS } from "../contracts/addresses";
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
   * Gets the standard ETH/Temple Token pool key
   */
  private getPoolKey(): PoolKey {
    return {
      currency0: POOL_CONSTANTS.ZERO_ADDRESS, // ETH
      currency1: TEMPLE_TOKEN_ADDRESS,
      fee: POOL_CONSTANTS.FEE_TIER,
      tickSpacing: POOL_CONSTANTS.TICK_SPACING,
      hooks: '0x092B9388Eea97444999C5fc6606eFF3d4CC000C8' // SimpleTempleHook
    };
  }

  /**
   * Gets a price quote for a swap
   */
  async getQuote(params: QuoteParams): Promise<QuoteResult | null> {
    try {
      console.log('📊 [QUOTE START] Starting quote with environment details:', {
        timestamp: new Date().toISOString(),
        chainId: await this.publicClient.getChainId(),
        rpcUrl: this.publicClient.transport?.url || 'unknown',
        quoterAddress: V4_QUOTER_ADDRESS,
        params: {
          poolKey: {
            currency0: params.poolKey.currency0,
            currency1: params.poolKey.currency1,
            fee: params.poolKey.fee,
            tickSpacing: params.poolKey.tickSpacing,
            hooks: params.poolKey.hooks
          },
          zeroForOne: params.zeroForOne,
          exactAmount: params.exactAmount.toString(),
          exactAmountFormatted: params.zeroForOne 
            ? `${(Number(params.exactAmount) / 1e18).toFixed(6)} ETH`
            : `${(Number(params.exactAmount) / 1e18).toFixed(6)} Temple`,
          hookData: params.hookData
        }
      });

      const result = await this.publicClient.simulateContract({
        address: V4_QUOTER_ADDRESS,
        abi: V4_QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [params] as any
      });

      const [amountOut, gasEstimate] = result.result;
      
      console.log('✅ [QUOTE SUCCESS] Quote successful:', {
        amountOut: amountOut.toString(),
        amountOutFormatted: params.zeroForOne
          ? `${(Number(amountOut) / 1e18).toFixed(6)} Temple`
          : `${(Number(amountOut) / 1e18).toFixed(6)} ETH`,
        gasEstimate: gasEstimate.toString(),
        gasEstimateGwei: (Number(gasEstimate) / 1e9).toFixed(2) + ' Gwei',
        timestamp: new Date().toISOString()
      });
      
      return {
        amountOut,
        gasEstimate
      };
    } catch (error) {
      console.error('❌ [QUOTE FAILED] Error getting quote:', {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
        errorCode: (error as any)?.code,
        errorData: (error as any)?.data,
        errorReason: (error as any)?.reason,
        params: {
          poolKey: params.poolKey,
          zeroForOne: params.zeroForOne,
          exactAmount: params.exactAmount.toString(),
          hookData: params.hookData
        },
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }

  /**
   * Gets a quote for buying Temple Token with ETH
   */
  async getBuyQuote(amountIn: string): Promise<QuoteResult | null> {
    if (!amountIn || Number(amountIn) <= 0) {
      return null;
    }

    const poolKey = this.getPoolKey();
    const exactAmountInWei = parseEther(amountIn);

    const params: QuoteParams = {
      poolKey,
      zeroForOne: true, // ETH -> Temple Token
      exactAmount: exactAmountInWei,
      hookData: "0x"
    };

    return this.getQuote(params);
  }

  /**
   * Gets a quote for selling Temple Token for ETH
   */
  async getSellQuote(amountIn: string): Promise<QuoteResult | null> {
    if (!amountIn || Number(amountIn) <= 0) {
      return null;
    }

    const poolKey = this.getPoolKey();
    // For Temple Token input, parse as Temple Token (18 decimals)
    const exactAmountInWei = parseEther(amountIn);

    const params: QuoteParams = {
      poolKey,
      zeroForOne: false, // Temple Token -> ETH
      exactAmount: exactAmountInWei,
      hookData: "0x"
    };

    return this.getQuote(params);
  }

  /**
   * Gets current ETH price in Temple Token
   */
  async getETHPrice(): Promise<number | null> {
    try {
      // Get quote for 1 ETH -> Temple Token
      const quote = await this.getBuyQuote("1");
      if (!quote) {
        return null;
      }

      // Convert Temple Token amount (18 decimals) to readable number
      const templeAmount = Number(quote.amountOut) / 1e18;
      
      console.log('✅ V4 ETH price from Quoter:', templeAmount);
      return templeAmount;
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