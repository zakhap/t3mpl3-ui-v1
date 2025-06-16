/**
 * Core types for Uniswap V4 operations
 */

// Pool types
export interface PoolKey {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
}

export interface PoolConfig {
  poolKey: PoolKey;
  zeroForOne: boolean;
  exactAmount: bigint;
  hookData: `0x${string}`;
}

export interface PoolState {
  sqrtPriceX96: bigint;
  tick: number;
  protocolFee: number;
  lpFee: number;
}

// Quote types
export interface QuoteParams {
  poolKey: PoolKey;
  zeroForOne: boolean;
  exactAmount: bigint;
  hookData: `0x${string}`;
}

export interface QuoteResult {
  amountOut: bigint;
  gasEstimate: bigint;
}

// Swap types
export interface SwapParams {
  tokenAddress: `0x${string}`;
  amountIn: string;
  minAmountOut: bigint;
  isBuying: boolean;
  slippagePercent: number;
}

export interface SwapResult {
  hash: `0x${string}`;
  success: boolean;
  error?: string;
}

export interface SwapData {
  commands: `0x${string}`;
  inputs: `0x${string}`[];
  value: bigint;
}

export interface PermitData {
  signature: `0x${string}`;
  details: {
    token: `0x${string}`;
    amount: bigint;
    expiration: number;
    nonce: number;
  };
  sigDeadline: bigint;
}

// Enums
export enum TradeType {
  BUY = 'buy',
  SELL = 'sell'
}

export enum SwapStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  FAILED = 'failed'
}

// Constants
export const POOL_CONSTANTS = {
  FEE_TIER: 3000, // 0.3%
  TICK_SPACING: 60,
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000' as const,
} as const;