/**
 * SwapManager - Orchestrates all swap operations for Uniswap V4
 */

import { PublicClient, WalletClient, parseEther } from "viem";
import { UNIVERSAL_ROUTER_ADDRESS, PERMIT2_ADDRESS, USDC_ADDRESS } from "../contracts/addresses";
import { calculateMinAmountOut, calculateGasWithBuffer, createDeadline } from "../utils/calculations";
import { 
  encodeBuyCommands,
  encodeSellCommands,
  encodeSwapActions,
  encodeSwapParams,
  encodeSettleParams,
  encodeTakeParams,
  encodeRouterInputs,
  encodePermit2Data,
  getPoolKey,
  getSwapDirection,
  parseAmount
} from "../utils/encoding";
import {
  checkUSDCAllowance,
  approveUSDCForPermit2,
  hasInsufficientUSDCAllowance,
  hasInsufficientUSDCBalance,
  parseUSDCAmount
} from "../utils/approvals";
import { 
  SwapParams, 
  SwapData, 
  SwapResult, 
  PermitData, 
  TradeType, 
  SwapStatus 
} from "../types";

// Permit2 ABI for nonce function
const PERMIT2_ABI = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [
      { internalType: "uint160", name: "amount", type: "uint160" },
      { internalType: "uint48", name: "expiration", type: "uint48" },
      { internalType: "uint48", name: "nonce", type: "uint48" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Universal Router ABI for execute function
const UNIVERSAL_ROUTER_ABI = [
  {
    inputs: [
      { internalType: "bytes", name: "commands", type: "bytes" },
      { internalType: "bytes[]", name: "inputs", type: "bytes[]" },
      { internalType: "uint256", name: "deadline", type: "uint256" }
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
] as const;

export class SwapManager {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient;
  }

  /**
   * Sets the wallet client for transaction signing
   */
  setWalletClient(walletClient: WalletClient): void {
    this.walletClient = walletClient;
  }

  /**
   * Validates chain and wallet before executing swaps
   */
  private async validateSwapPreconditions(): Promise<void> {
    if (!this.walletClient) {
      throw new Error("No wallet connected");
    }

    const currentChain = await this.walletClient.getChainId();
    if (currentChain !== 8453) {
      throw new Error("Please switch to the Base network");
    }
  }

  /**
   * Encodes buy swap data (ETH -> USDC) using proper V4 encoding
   */
  private encodeBuyData(amountIn: string, minAmountOut: bigint): SwapData {
    console.log('🔧 [DEBUG] Starting encodeBuyData with:', { amountIn, minAmountOut: minAmountOut.toString() });
    
    const poolKey = getPoolKey();
    console.log('🔧 [DEBUG] Pool key:', poolKey);
    
    const parsedAmountIn = parseEther(amountIn);
    console.log('🔧 [DEBUG] Parsed amount in (wei):', parsedAmountIn.toString());
    
    const zeroForOne = getSwapDirection(true); // ETH -> USDC
    console.log('🔧 [DEBUG] Swap direction zeroForOne:', zeroForOne);
    
    // Encode all components using utility functions
    const commands = encodeBuyCommands();
    console.log('🔧 [DEBUG] Encoded commands:', commands);
    
    const actions = encodeSwapActions();
    console.log('🔧 [DEBUG] Encoded actions:', actions);
    
    const swapParams = encodeSwapParams(poolKey, zeroForOne, amountIn, minAmountOut);
    console.log('🔧 [DEBUG] Encoded swap params:', swapParams);
    
    const settleParams = encodeSettleParams(poolKey.currency0, parsedAmountIn);
    console.log('🔧 [DEBUG] Encoded settle params:', settleParams);
    
    const takeParams = encodeTakeParams(poolKey.currency1, BigInt(0));
    console.log('🔧 [DEBUG] Encoded take params:', takeParams);
    
    const inputs = encodeRouterInputs(actions, [swapParams, settleParams, takeParams]);
    console.log('🔧 [DEBUG] Final encoded inputs:', inputs);

    const result = {
      commands,
      inputs: [inputs],
      value: parsedAmountIn // When buying, we send ETH
    };
    
    console.log('🔧 [DEBUG] encodeBuyData result:', {
      commands: result.commands,
      inputsLength: result.inputs.length,
      value: result.value.toString()
    });
    
    return result;
  }

  /**
   * Executes a buy swap (ETH -> USDC) using real V4 transactions
   */
  async executeBuySwap(params: SwapParams): Promise<SwapResult> {
    try {
      console.log('🚀 [PRODUCTION DEBUG] Starting buy swap with full environment details:', {
        timestamp: new Date().toISOString(),
        chainId: await this.publicClient.getChainId(),
        rpcUrl: this.publicClient.transport?.url || 'unknown',
        universalRouter: UNIVERSAL_ROUTER_ADDRESS,
        permit2: PERMIT2_ADDRESS,
        usdc: USDC_ADDRESS,
        nodeEnv: typeof window !== 'undefined' ? 'browser' : 'server',
        viteEnv: import.meta.env?.MODE || 'unknown'
      });

      await this.validateSwapPreconditions();
      
      console.log('🔄 Executing buy swap:', {
        amountIn: params.amountIn,
        minAmountOut: params.minAmountOut.toString(),
        slippage: params.slippagePercent,
        userAddress: params.userAddress
      });

      const minAmountOut = calculateMinAmountOut(params.minAmountOut, params.slippagePercent);
      console.log('🔧 [DEBUG] Calculated minAmountOut:', minAmountOut.toString());
      
      const { commands, inputs, value } = this.encodeBuyData(params.amountIn, minAmountOut);
      console.log('🔧 [DEBUG] Encoded swap data:', {
        commands: commands,
        inputsLength: inputs.length,
        value: value.toString(),
        poolKey: getPoolKey()
      });

      // Get user address
      const [userAddress] = await this.walletClient!.getAddresses();
      console.log('👤 [DEBUG] User address:', userAddress);

      const deadline = createDeadline();
      console.log('⏰ [DEBUG] Transaction deadline:', deadline);

      // Estimate gas
      console.log('⛽ [DEBUG] Attempting gas estimation...');
      let gasEstimate: bigint;
      try {
        gasEstimate = await this.publicClient.estimateContractGas({
          address: UNIVERSAL_ROUTER_ADDRESS,
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [commands, inputs, deadline],
          value,
          account: userAddress
        });
        console.log('⛽ [DEBUG] Gas estimation successful:', gasEstimate.toString());
      } catch (gasError) {
        console.error('❌ [DEBUG] Gas estimation failed:', gasError);
        throw new Error(`Gas estimation failed: ${gasError.message}`);
      }

      const gasLimit = calculateGasWithBuffer(gasEstimate);

      console.log('💰 Executing Universal Router transaction...');

      // Execute transaction
      const hash = await this.walletClient!.writeContract({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [commands, inputs, createDeadline()],
        gas: gasLimit,
        value,
      } as any);

      console.log('📝 Transaction sent:', hash);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      console.log('✅ Buy swap completed:', receipt.status);

      return {
        hash,
        success: receipt.status === "success",
        error: receipt.status !== "success" ? "Transaction failed" : undefined
      };

    } catch (error) {
      console.error('❌ Buy swap failed:', error);
      return {
        hash: "0x0" as `0x${string}`,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Executes a sell swap (USDC -> ETH) with proper approvals and Permit2
   */
  async executeSellSwap(params: SwapParams, userAddress: `0x${string}`): Promise<SwapResult> {
    try {
      await this.validateSwapPreconditions();
      
      console.log('🔄 Executing sell swap:', {
        amountIn: params.amountIn,
        minAmountOut: params.minAmountOut.toString(),
        slippage: params.slippagePercent,
        userAddress
      });

      const requiredAmount = parseUSDCAmount(params.amountIn);

      // Check USDC balance first
      if (await hasInsufficientUSDCBalance(this.publicClient, userAddress, requiredAmount)) {
        throw new Error(`Insufficient USDC balance. Required: ${params.amountIn} USDC`);
      }

      // Check USDC allowance for Permit2
      if (await hasInsufficientUSDCAllowance(this.publicClient, userAddress, requiredAmount)) {
        console.log('⚠️ Insufficient USDC allowance, requesting approval...');
        
        const approvalHash = await approveUSDCForPermit2(this.walletClient!);
        if (!approvalHash) {
          throw new Error('USDC approval failed');
        }

        console.log('⏳ Waiting for USDC approval confirmation...');
        const approvalReceipt = await this.publicClient.waitForTransactionReceipt({ hash: approvalHash });
        
        if (approvalReceipt.status !== "success") {
          throw new Error('USDC approval transaction failed');
        }
        
        console.log('✅ USDC approved for Permit2');
      }

      // Get current nonce from Permit2 contract
      const [, , nonce] = await this.publicClient.readContract({
        address: PERMIT2_ADDRESS,
        abi: PERMIT2_ABI,
        functionName: "allowance",
        args: [userAddress, USDC_ADDRESS, UNIVERSAL_ROUTER_ADDRESS],
      });

      // Create permit signature
      const deadline = createDeadline(10); // 10 minutes
      const permitMessage = {
        details: {
          token: USDC_ADDRESS,
          amount: requiredAmount,
          expiration: deadline,
          nonce,
        },
        spender: UNIVERSAL_ROUTER_ADDRESS,
        sigDeadline: deadline,
      };

      console.log('✍️ Requesting Permit2 signature...');

      const signature = await this.walletClient!.signTypedData({
        domain: {
          name: 'Permit2',
          chainId: 8453, // Base chain ID
          verifyingContract: PERMIT2_ADDRESS,
        },
        types: {
          PermitSingle: [
            { name: 'details', type: 'PermitDetails' },
            { name: 'spender', type: 'address' },
            { name: 'sigDeadline', type: 'uint256' },
          ],
          PermitDetails: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint160' },
            { name: 'expiration', type: 'uint48' },
            { name: 'nonce', type: 'uint48' },
          ],
        },
        primaryType: 'PermitSingle',
        message: permitMessage,
      } as any);

      const permit: PermitData = {
        signature,
        details: {
          token: USDC_ADDRESS,
          amount: requiredAmount,
          expiration: Number(deadline),
          nonce: Number(nonce)
        },
        sigDeadline: deadline
      };

      const minAmountOut = calculateMinAmountOut(params.minAmountOut, params.slippagePercent);
      
      // Encode sell swap with permit using proper V4 encoding
      const poolKey = getPoolKey();
      const zeroForOne = getSwapDirection(false); // USDC -> ETH
      
      console.log('🔧 Sell swap encoding details:', {
        poolKey,
        zeroForOne,
        amountIn: params.amountIn,
        minAmountOut: minAmountOut.toString(),
        requiredAmount: requiredAmount.toString(),
        permitDetails: permit.details
      });
      
      const commands = encodeSellCommands();
      const actions = encodeSwapActions();
      const permitInputs = encodePermit2Data(permit);
      const swapParams = encodeSwapParams(poolKey, zeroForOne, params.amountIn, minAmountOut, true);
      const settleParams = encodeSettleParams(poolKey.currency1, requiredAmount);
      const takeParams = encodeTakeParams(poolKey.currency0, BigInt(0));
      
      const swapInputs = encodeRouterInputs(actions, [swapParams, settleParams, takeParams]);

      // Try to estimate gas, fallback to high limit if it fails
      let gasLimit: bigint;
      try {
        const gasEstimate = await this.publicClient.estimateContractGas({
          address: UNIVERSAL_ROUTER_ADDRESS,
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [commands, [permitInputs, swapInputs], createDeadline()],
          value: BigInt(0),
          account: userAddress
        });
        gasLimit = calculateGasWithBuffer(gasEstimate);
      } catch {
        // Fallback to high gas limit if estimation fails
        gasLimit = BigInt(3000000);
      }

      console.log('💰 Executing Universal Router sell transaction...');

      // Execute transaction
      const hash = await this.walletClient!.writeContract({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [commands, [permitInputs, swapInputs], createDeadline()],
        gas: gasLimit,
        value: BigInt(0),
      } as any);

      console.log('📝 Transaction sent:', hash);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      console.log('✅ Sell swap completed:', receipt.status);

      return {
        hash,
        success: receipt.status === "success",
        error: receipt.status !== "success" ? "Transaction failed" : undefined
      };

    } catch (error) {
      console.error('❌ Sell swap failed:', error);
      return {
        hash: "0x0" as `0x${string}`,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Main swap execution method that routes to buy or sell
   */
  async executeSwap(params: SwapParams, userAddress: `0x${string}`): Promise<SwapResult> {
    if (params.isBuying) {
      return this.executeBuySwap(params);
    } else {
      return this.executeSellSwap(params, userAddress);
    }
  }
}