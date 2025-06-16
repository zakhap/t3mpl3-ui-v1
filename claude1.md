# Uniswap v4 SDK - Complete Technical Reference

This is a comprehensive guide to the Uniswap v4 SDK codebase located at `/Users/z/Documents/github/sdks/sdks/v4-sdk`. Use this reference for understanding capabilities, limitations, and implementation patterns.

## Architecture Overview

The Uniswap v4 SDK is a TypeScript library for interacting with Uniswap v4's singleton architecture. Unlike v3's individual pool contracts, v4 uses a single PoolManager contract managing all pools with extensible hooks.

### Key Architectural Differences from v3
- **Singleton PoolManager**: All pools exist within one contract
- **Hooks System**: Custom logic via hook contracts with permission flags
- **Native Currency Support**: ETH/MATIC can be pool tokens directly (ADDRESS_ZERO)
- **Dynamic Fees**: Variable fees controlled by hooks (DYNAMIC_FEE_FLAG = 0x800000)

### Dependencies
```json
{
  "@uniswap/v4-sdk": "latest",
  "@uniswap/sdk-core": "^7.7.1", 
  "@uniswap/v3-sdk": "3.25.2",
  "@ethersproject/solidity": "^5.0.9"
}
```

## Core Entities

### Pool Class
Primary interface for v4 pool representation with hook integration.

```typescript
// Constructor
new Pool(
  currencyA: Currency,
  currencyB: Currency,
  fee: number,                    // Can be DYNAMIC_FEE_FLAG (0x800000)
  tickSpacing: number,
  hooks: string,                  // Hook contract address (required)
  sqrtRatioX96: BigintIsh,
  liquidity: BigintIsh,
  tickCurrent: number,
  ticks?: TickDataProvider
)

// Key Properties
pool.poolKey: PoolKey              // Unique pool identifier
pool.poolId: string                // Keccak256 hash of poolKey
pool.currency0/currency1: Currency // Always sorted
pool.hooks: string                 // Hook contract address
pool.fee: number                   // Fee tier or DYNAMIC_FEE_FLAG

// Methods
pool.involvesCurrency(currency): boolean
pool.v4InvolvesToken(currency): boolean     // v4-specific with wrap/unwrap
pool.getOutputAmount(inputAmount): Promise<[CurrencyAmount, Pool]>  // Vanilla pools only
pool.getInputAmount(outputAmount): Promise<[CurrencyAmount, Pool]>   // Vanilla pools only

// Static Methods
Pool.getPoolKey(currencyA, currencyB, fee, tickSpacing, hooks): PoolKey
Pool.getPoolId(currencyA, currencyB, fee, tickSpacing, hooks): string
```

### Position Class
Represents concentrated liquidity positions with v4-specific calculations.

```typescript
// Constructor
new Position({
  pool: Pool,
  liquidity: BigintIsh,
  tickLower: number,
  tickUpper: number
})

// Properties
position.amount0/amount1: CurrencyAmount     // Current amounts
position.mintAmounts: { amount0: JSBI; amount1: JSBI }
position.token0PriceLower/Upper: Price

// Slippage Protection
position.mintAmountsWithSlippage(slippageTolerance: Percent): { amount0: JSBI, amount1: JSBI }
position.burnAmountsWithSlippage(slippageTolerance: Percent): { amount0: JSBI, amount1: JSBI }

// Static Factory Methods
Position.fromAmounts({ pool, tickLower, tickUpper, amount0, amount1, useFullPrecision })
Position.fromAmount0({ pool, tickLower, tickUpper, amount0, useFullPrecision })
Position.fromAmount1({ pool, tickLower, tickUpper, amount1 })

// Permit2 Integration
position.permitBatchData(slippageTolerance, spender, nonce, deadline): AllowanceTransferPermitBatch
```

### Route and Trade Classes
Multi-hop routing and trade optimization.

```typescript
// Route
new Route(pools: Pool[], input: Currency, output: Currency)
route.pools: Pool[]
route.currencyPath: Currency[]
route.midPrice: Price

// Trade
Trade.exactIn(route: Route, amountIn: CurrencyAmount): Promise<Trade>
Trade.exactOut(route: Route, amountOut: CurrencyAmount): Promise<Trade>
Trade.bestTradeExactIn(pools, amountIn, currencyOut, options): Promise<Trade[]>
Trade.bestTradeExactOut(pools, currencyIn, amountOut, options): Promise<Trade[]>

// Trade Properties
trade.inputAmount/outputAmount: CurrencyAmount
trade.executionPrice: Price
trade.priceImpact: Percent
trade.minimumAmountOut(slippageTolerance): CurrencyAmount
trade.maximumAmountIn(slippageTolerance): CurrencyAmount
```

## Transaction Planning System

### V4Planner
Core system for batching v4 operations.

```typescript
const planner = new V4Planner()

// Add Actions
planner.addAction(type: Actions, parameters: any[]): V4Planner
planner.addTrade(trade: Trade, slippageTolerance?: Percent): V4Planner

// Payment Operations
planner.addSettle(currency: Currency, payerIsUser: boolean, amount?: BigNumber): V4Planner
planner.addTake(currency: Currency, recipient: string, amount?: BigNumber): V4Planner
planner.addUnwrap(amount: BigNumber): V4Planner

// Generate Calldata
planner.finalize(): string
```

### V4PositionPlanner
Specialized planner for position operations.

```typescript
const positionPlanner = new V4PositionPlanner()

// Position Lifecycle
positionPlanner.addMint(pool, tickLower, tickUpper, liquidity, amount0Max, amount1Max, owner, hookData?)
positionPlanner.addIncrease(tokenId, liquidity, amount0Max, amount1Max, hookData?)
positionPlanner.addDecrease(tokenId, liquidity, amount0Min, amount1Min, hookData?)
positionPlanner.addBurn(tokenId, amount0Min, amount1Min, hookData?)

// Payment Operations
positionPlanner.addSettlePair(currency0, currency1)
positionPlanner.addTakePair(currency0, currency1, recipient)
positionPlanner.addSweep(currency, recipient)
```

### Actions Enum
Available action types for planners.

```typescript
enum Actions {
  // Position Management
  INCREASE_LIQUIDITY = 0x00,
  DECREASE_LIQUIDITY = 0x01,
  MINT_POSITION = 0x02,
  BURN_POSITION = 0x03,
  
  // Trading
  SWAP_EXACT_IN_SINGLE = 0x06,
  SWAP_EXACT_IN = 0x07,
  SWAP_EXACT_OUT_SINGLE = 0x08,
  SWAP_EXACT_OUT = 0x09,
  
  // Balance Management
  SETTLE = 0x0b,
  SETTLE_ALL = 0x0c,
  SETTLE_PAIR = 0x0d,
  TAKE = 0x0e,
  TAKE_ALL = 0x0f,
  TAKE_PAIR = 0x11,
  SWEEP = 0x14,
  UNWRAP = 0x16,
}
```

## V4PositionManager Interface

High-level interface for position operations.

```typescript
// Pool Creation
V4PositionManager.createCallParameters(poolKey: PoolKey, sqrtPriceX96: BigintIsh): MethodParameters

// Position Management
V4PositionManager.addCallParameters(position: Position, options: AddLiquidityOptions): MethodParameters
V4PositionManager.removeCallParameters(position: Position, options: RemoveLiquidityOptions): MethodParameters
V4PositionManager.collectCallParameters(position: Position, options: CollectOptions): MethodParameters

// Low-level Encoding
V4PositionManager.encodeModifyLiquidities(unlockData: string, deadline: BigintIsh): string
V4PositionManager.encodePermitBatch(owner, permitBatch, signature): string
V4PositionManager.encodeERC721Permit(spender, tokenId, deadline, nonce, signature): string

// EIP-712 Permit Data
V4PositionManager.getPermitData(permit, positionManagerAddress, chainId): NFTPermitData
```

### Option Types

```typescript
// Common Options
interface CommonOptions {
  slippageTolerance: Percent
  deadline: BigintIsh
  hookData?: string
}

// Minting Options
interface MintOptions extends CommonOptions {
  recipient: string
  createPool?: boolean
  sqrtPriceX96?: BigintIsh
  migrate?: boolean
  useNative?: NativeCurrency
  batchPermit?: BatchPermitOptions
}

// Increase Liquidity Options
interface IncreaseLiquidityOptions extends CommonOptions {
  tokenId: BigintIsh
  useNative?: NativeCurrency
  batchPermit?: BatchPermitOptions
}

// Remove Liquidity Options
interface RemoveLiquidityOptions extends CommonOptions {
  tokenId: BigintIsh
  liquidityPercentage: Percent
  burnToken?: boolean
  permit?: NFTPermitOptions
}

// Collect Options
interface CollectOptions extends CommonOptions {
  tokenId: BigintIsh
  recipient: string
}
```

## Hook System Integration

### Hook Class
Analysis and validation of hook permissions.

```typescript
// Permission Analysis
Hook.permissions(address: string): HookPermissions
Hook.hasPermission(address: string, hookOption: HookOptions): boolean

// Permission Categories
Hook.hasInitializePermissions(address: string): boolean
Hook.hasLiquidityPermissions(address: string): boolean
Hook.hasSwapPermissions(address: string): boolean
Hook.hasDonatePermissions(address: string): boolean
```

### Hook Options
```typescript
enum HookOptions {
  BeforeInitialize = 'beforeInitialize',
  AfterInitialize = 'afterInitialize',
  BeforeAddLiquidity = 'beforeAddLiquidity',
  AfterAddLiquidity = 'afterAddLiquidity',
  BeforeRemoveLiquidity = 'beforeRemoveLiquidity',
  AfterRemoveLiquidity = 'afterRemoveLiquidity',
  BeforeSwap = 'beforeSwap',
  AfterSwap = 'afterSwap',
  BeforeDonate = 'beforeDonate',
  AfterDonate = 'afterDonate',
  BeforeSwapReturnsDelta = 'beforeSwapReturnsDelta',
  AfterSwapReturnsDelta = 'afterSwapReturnsDelta',
  AfterAddLiquidityReturnsDelta = 'afterAddLiquidityReturnsDelta',
  AfterRemoveLiquidityReturnsDelta = 'afterRemoveLiquidityReturnsDelta'
}
```

## Utility Functions

### Currency and Address Utilities
```typescript
import { toAddress, sortsBefore } from './utils/currencyMap'
import { getPathCurrency, amountWithPathCurrency } from './utils/pathCurrency'

// Convert currency to address (ADDRESS_ZERO for native)
const address = toAddress(currency)

// Currency ordering for pools
const isFirstCurrency = sortsBefore(currencyA, currencyB)

// Path currency handling
const pathCurrency = getPathCurrency(inputCurrency, pool)
```

### Price and Tick Conversions
```typescript
import { priceToClosestTick, tickToPrice } from './utils/priceTickConversions'

const tick = priceToClosestTick(price)
const price = tickToPrice(baseCurrency, quoteCurrency, tick)
```

### Route Encoding
```typescript
import { encodeRouteToPath } from './utils/encodeRouteToPath'

const pathKeys: PathKey[] = encodeRouteToPath(route, exactOutput: boolean)
```

### Transaction Parsing
```typescript
import { V4BaseActionsParser } from './utils/v4BaseActionsParser'

const parsedCall = V4BaseActionsParser.parseCalldata(calldata)
```

### Multicall Support
```typescript
import { Multicall } from './multicall'

const batchCalldata = Multicall.encodeMulticall(calldataList)
const decodedCalls = Multicall.decodeMulticall(encodedCalldata)
```

## Important Constants

```typescript
// Addresses
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const EMPTY_HOOK = '0x0000000000000000000000000000000000000000'
export const MSG_SENDER = '0x0000000000000000000000000000000000000001'

// Special Values
export const EMPTY_BYTES = '0x'
export const DYNAMIC_FEE_FLAG = 0x800000
export const OPEN_DELTA = 0

// Fee Tiers
export enum FeeAmount {
  LOWEST = 100,   // 0.01%
  LOW = 500,      // 0.05%
  MEDIUM = 3000,  // 0.30%
  HIGH = 10000    // 1.00%
}

export const TICK_SPACINGS = {
  [FeeAmount.LOWEST]: 1,
  [FeeAmount.LOW]: 10,
  [FeeAmount.MEDIUM]: 60,
  [FeeAmount.HIGH]: 200
}

// Math Constants
export const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))
export const Q192 = JSBI.exponentiate(Q96, JSBI.BigInt(2))
```

## Usage Examples

### Basic Pool Creation and Position Management
```typescript
// Create pool representation
const pool = new Pool(
  USDC, WETH,
  FeeAmount.MEDIUM,
  TICK_SPACINGS[FeeAmount.MEDIUM],
  EMPTY_HOOK,
  currentSqrtPriceX96,
  currentLiquidity,
  currentTick
)

// Create position
const position = Position.fromAmounts({
  pool,
  tickLower: -1000,
  tickUpper: 1000,
  amount0: amount0Desired,
  amount1: amount1Desired,
  useFullPrecision: true
})

// Generate mint transaction
const mintParams = V4PositionManager.addCallParameters(position, {
  recipient: userAddress,
  deadline: Math.floor(Date.now() / 1000) + 600,
  slippageTolerance: new Percent(50, 10000), // 0.5%
  useNative: ETHER
})
```

### Hook-Enabled Pool
```typescript
const customHookPool = new Pool(
  tokenA, tokenB,
  FeeAmount.MEDIUM,
  TICK_SPACINGS[FeeAmount.MEDIUM],
  customHookAddress,
  sqrtPriceX96,
  liquidity,
  currentTick
)

// Check hook capabilities
const permissions = Hook.permissions(customHookAddress)
console.log('Hook can modify swaps:', permissions.beforeSwap || permissions.afterSwap)
```

### Dynamic Fee Pool
```typescript
const dynamicFeePool = new Pool(
  tokenA, tokenB,
  DYNAMIC_FEE_FLAG,
  60,
  dynamicFeeHookAddress,
  sqrtPriceX96,
  liquidity,
  currentTick
)
```

### Multi-hop Trading
```typescript
// Create route
const route = new Route([usdcWethPool, wethDaiPool], USDC, DAI)

// Create trade
const trade = await Trade.exactIn(route, CurrencyAmount.fromRawAmount(USDC, inputAmount))

// Add to planner
const planner = new V4Planner()
planner.addTrade(trade, new Percent(50, 10000)) // 0.5% slippage

const calldata = planner.finalize()
```

### Batch Operations
```typescript
const planner = new V4PositionPlanner()

// Add liquidity
planner.addIncrease(tokenId, liquidityDelta, amount0Max, amount1Max)

// Take tokens
planner.addTakePair(pool.currency0, pool.currency1, recipient)

// Handle native sweeping
if (pool.currency0.isNative) {
  planner.addSweep(pool.currency0, recipient)
}

const calldata = planner.finalize()
```

## Capabilities ✅

### Liquidity Management
- Create and manage concentrated liquidity positions
- Mint, increase, decrease, and burn positions
- Collect accumulated fees
- Handle native currency pools (ETH/MATIC as pool tokens)
- Slippage protection with automatic calculations
- Batch multiple operations in single transaction

### Trading Operations
- Execute exact input/output swaps for vanilla pools
- Multi-hop routing through multiple pools
- Trade optimization with best route finding
- Price impact calculations and slippage management
- Encode swap calldata for various swap types

### Hook Integration
- Analyze hook permissions and capabilities
- Create pools with custom hooks
- Handle dynamic fee pools
- Pass hook data to hook contracts

### Transaction Planning
- Batch complex operations efficiently
- Encode multi-action transactions
- Handle wrapped/unwrapped currency conversions
- Parse and analyze existing v4 transaction calldata

### Pool Analysis
- Calculate theoretical swap outputs for planning
- Analyze pool state and current prices
- Generate pool identifiers and keys
- Price/tick conversions for position management

## Limitations ❌

### Hook Limitations
- Cannot simulate swaps through hooks with swap permissions
- Cannot predict hook behavior or side effects
- No hook development tools
- Cannot modify hook permissions after pool creation

### Swap Limitations
- No aggregation across DEXs
- Cannot handle partial fills or advanced order types
- Limited to pools with compatible tick data
- Cannot guarantee execution if pool state changes

### Position Constraints
- Cannot transfer position NFTs
- No position analytics beyond basic amounts
- Cannot handle out-of-range positions specially
- No automatic rebalancing strategies

### Technical Limitations
- TypeScript/JavaScript only
- Node.js v14+ required
- No built-in state management
- Cannot work offline
- Large bundle size impact

### Network Constraints
- v4 not yet deployed on mainnet (as of SDK version)
- No cross-chain functionality
- Cannot interact with v2/v3 pools directly

## Error Handling Patterns

```typescript
// Check hook compatibility before swap simulation
if (pool.hookImpactsSwap()) {
  console.warn('Cannot simulate swaps for this hooked pool')
} else {
  const [outputAmount] = await pool.getOutputAmount(inputAmount)
}

// Handle insufficient liquidity
try {
  const trades = await Trade.bestTradeExactIn(pools, amountIn, tokenOut)
  if (trades.length === 0) {
    throw new Error('No viable trading route found')
  }
} catch (error) {
  if (error.message.includes('INSUFFICIENT_INPUT_AMOUNT')) {
    // Handle insufficient input
  }
}

// Validate hook addresses
import { isAddress } from 'ethers/lib/utils'

if (!isAddress(hookAddress)) {
  throw new Error('Invalid hook address')
}
```

## Best Practices

### Performance Optimization
- Use V4Planner for batching operations to minimize gas costs
- Cache pool state when possible
- Use Trade.createUncheckedTrade when you have pre-computed amounts
- Consider bundle size impact for web applications

### Error Prevention
- Always validate hook addresses before pool creation
- Check hook permissions before assuming functionality
- Use slippage protection for all user-facing operations
- Handle native currency edge cases properly

### Gas Optimization
- Batch related operations using planners
- Use SETTLE_PAIR and TAKE_PAIR for efficiency
- Minimize the number of separate transactions
- Consider using multicall for complex operations

This reference covers the complete Uniswap v4 SDK codebase as implemented in the source files. Use it to understand the full capabilities and constraints when building applications on Uniswap v4.