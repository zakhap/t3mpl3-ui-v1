/**
 * Uniswap V4 Library - Public API
 * 
 * A comprehensive library for interacting with Uniswap V4 on Base network.
 * Provides both low-level managers and high-level React hooks for swap operations.
 */

// Core Managers
export { QuoteManager } from './core/QuoteManager';
export { SwapManager } from './core/SwapManager';

// Types
export type {
  // Pool types
  PoolKey,
  PoolConfig,
  PoolState,
  
  // Swap types
  SwapParams,
  SwapData,
  QuoteParams,
  QuoteResult,
  PermitData,
  SwapResult,
} from './types';

export { 
  TradeType, 
  SwapStatus,
  POOL_CONSTANTS 
} from './types';

// Contract Information
export {
  // Addresses
  UNIVERSAL_ROUTER_ADDRESS,
  PERMIT2_ADDRESS,
  V4_QUOTER_ADDRESS,
  POOL_MANAGER_ADDRESS,
  STATE_VIEW_ADDRESS,
  USDC_ADDRESS,
  ADDRESSES
} from './contracts/addresses';

export {
  // ABIs
  ERC20_ABI,
  STATE_VIEW_ABI
} from './contracts/abis';

export {
  // Commands
  V4_SWAP,
  PERMIT2_PERMIT,
  Actions,
  COMMANDS
} from './contracts/commands';

// Utilities
export {
  // Calculation utilities
  calculateMinAmountOut,
  calculateGasWithBuffer,
  createDeadline
} from './utils/calculations';

export {
  // Encoding utilities
  encodeBuyCommands,
  encodeSellCommands,
  encodeSwapActions,
  encodeSwapParams,
  encodeSettleParams,
  encodeTakeParams,
  encodeRouterInputs,
  encodePermit2Data,
  encodePoolId,
  parseAmount,
  getSwapDirection,
  getPoolKey
} from './utils/encoding';

export {
  // Approval utilities
  checkUSDCAllowance,
  checkUSDCBalance,
  approveUSDCForPermit2,
  hasInsufficientUSDCAllowance,
  hasInsufficientUSDCBalance,
  formatUSDCAmount,
  parseUSDCAmount
} from './utils/approvals';

// Hooks
export { useSwap, useBuySwap, useSellSwap } from './hooks/useSwap';