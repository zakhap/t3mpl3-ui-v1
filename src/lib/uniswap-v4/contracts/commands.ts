/**
 * Uniswap V4 Universal Router Commands and Action Constants
 */

// Universal Router Commands
export const V4_SWAP = 0x10;
export const PERMIT2_PERMIT = 0x0a;

// Uniswap V4 Action Types
export const Actions = {
  // Swapping
  SWAP_EXACT_IN_SINGLE: 0x06,
  SETTLE_ALL: 0x0c,
  TAKE_ALL: 0x0f,
} as const;

// Command constants for easier access
export const COMMANDS = {
  V4_SWAP,
  PERMIT2_PERMIT,
} as const;

// Type for command values
export type Command = typeof COMMANDS[keyof typeof COMMANDS];
export type Action = typeof Actions[keyof typeof Actions];