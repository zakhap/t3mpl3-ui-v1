/**
 * Encoding utilities for Uniswap V4 transactions
 */

import { encodeAbiParameters, encodePacked, parseEther, parseUnits, keccak256 } from "viem";
import { V4_SWAP, PERMIT2_PERMIT, Actions } from "../contracts/commands";
import { UNIVERSAL_ROUTER_ADDRESS } from "../contracts/addresses";
import { PoolKey } from "../types/index";
import { PermitData } from "../types/index";

/**
 * Encodes Universal Router commands for buying (ETH -> Token)
 */
export function encodeBuyCommands(): `0x${string}` {
  return encodePacked(["uint8"], [V4_SWAP]);
}

/**
 * Encodes Universal Router commands for selling (Token -> ETH) with Permit2
 */
export function encodeSellCommands(): `0x${string}` {
  return encodePacked(["uint8", "uint8"], [PERMIT2_PERMIT, V4_SWAP]);
}

/**
 * Encodes V4 Router actions for swap operations
 */
export function encodeSwapActions(): `0x${string}` {
  return encodePacked(
    ["uint8", "uint8", "uint8"],
    [Actions.SWAP_EXACT_IN_SINGLE, Actions.SETTLE_ALL, Actions.TAKE_ALL]
  );
}

/**
 * Encodes swap parameters for exact input single swap
 */
export function encodeSwapParams(
  poolKey: PoolKey,
  zeroForOne: boolean,
  amountIn: string,
  minAmountOut: bigint,
  isTempleInput: boolean = false
): `0x${string}` {
  const parsedAmountIn = parseEther(amountIn); // Both ETH and Temple Token use 18 decimals
  
  return encodeAbiParameters(
    [
      {
        name: "poolKey",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" }
        ]
      },
      { name: "zeroForOne", type: "bool" },
      { name: "amountIn", type: "uint128" },
      { name: "amountOutMinimum", type: "uint256" },
      { name: "hookData", type: "bytes" }
    ],
    [poolKey, zeroForOne, parsedAmountIn, minAmountOut, "0x"]
  );
}

/**
 * Encodes settle parameters for Universal Router
 */
export function encodeSettleParams(
  token: `0x${string}`,
  amount: bigint
): `0x${string}` {
  return encodeAbiParameters(
    [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    [token, amount]
  );
}

/**
 * Encodes take parameters for Universal Router
 */
export function encodeTakeParams(
  token: `0x${string}`,
  amount: bigint
): `0x${string}` {
  return encodeAbiParameters(
    [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    [token, amount]
  );
}

/**
 * Encodes final router inputs combining actions and parameters
 */
export function encodeRouterInputs(
  actions: `0x${string}`,
  params: `0x${string}`[]
): `0x${string}` {
  return encodeAbiParameters(
    [
      { name: "actions", type: "bytes" },
      { name: "params", type: "bytes[]" }
    ],
    [actions, params]
  );
}

/**
 * Encodes Permit2 signature data for token approvals
 */
export function encodePermit2Data(permit: PermitData): `0x${string}` {
  return encodeAbiParameters(
    [
      {
        name: "permitSingle",
        type: "tuple",
        components: [
          {
            name: "details",
            type: "tuple",
            components: [
              { name: "token", type: "address" },
              { name: "amount", type: "uint160" },
              { name: "expiration", type: "uint48" },
              { name: "nonce", type: "uint48" }
            ]
          },
          { name: "spender", type: "address" },
          { name: "sigDeadline", type: "uint256" }
        ]
      },
      { name: "signature", type: "bytes" }
    ],
    [
      {
        details: {
          token: permit.details.token,
          amount: permit.details.amount,
          expiration: permit.details.expiration,
          nonce: permit.details.nonce
        },
        spender: UNIVERSAL_ROUTER_ADDRESS,
        sigDeadline: permit.sigDeadline
      },
      permit.signature
    ]
  );
}

/**
 * Generates pool ID hash from pool key
 */
export function encodePoolId(poolKey: PoolKey): `0x${string}` {
  const encodedKey = encodeAbiParameters(
    [
      {
        name: 'key',
        type: 'tuple',
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' }
        ]
      }
    ],
    [poolKey]
  );
  
  return keccak256(encodedKey as `0x${string}`);
}

/**
 * Helper to parse amount for Temple Token (18 decimals) vs ETH (18 decimals)
 */
export function parseAmount(amount: string, isTemple: boolean = false): bigint {
  // Both ETH and Temple Token have 18 decimals
  return parseEther(amount);
}

/**
 * Get swap direction for pool operations
 * For our ETH/Temple Token pool: currency0=ETH, currency1=Temple Token
 * Buy (ETH->Temple Token): zeroForOne = true (swap currency0 for currency1)
 * Sell (Temple Token->ETH): zeroForOne = false (swap currency1 for currency0)
 */
export function getSwapDirection(isBuying: boolean): boolean {
  return isBuying; // ETH -> Temple Token = true (zeroForOne), Temple Token -> ETH = false
}

/**
 * Get pool key for ETH/Temple Token pool on Sepolia  
 * In Uniswap V4, native ETH is represented as 0x0 (CurrencyLibrary.NATIVE)
 * Pool key currencies should be ordered: lower address first
 */
export function getPoolKey(): PoolKey {
  return {
    currency0: '0x0000000000000000000000000000000000000000', // ETH (native, always 0x0 in V4)
    currency1: '0xE6BBfB40bAFe0Ec62eB687d5681C920B5d15FD17', // Temple Token on Sepolia
    fee: 3000, // 0.3%
    tickSpacing: 60,
    hooks: '0x092B9388Eea97444999C5fc6606eFF3d4CC000C8' // SimpleTempleHook
  };
}