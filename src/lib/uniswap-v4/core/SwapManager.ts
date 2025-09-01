/**
 * SwapManager - Orchestrates all swap operations for Uniswap V4
 */

import { PublicClient, WalletClient, parseEther } from "viem";
import { UNIVERSAL_ROUTER_ADDRESS, PERMIT2_ADDRESS, TEMPLE_TOKEN_ADDRESS } from "../contracts/addresses";
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
  checkTempleAllowance,
  approveTempleForPermit2,
  hasInsufficientTempleAllowance,
  hasInsufficientTempleBalance,
  parseTempleAmount
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
    if (currentChain !== 11155111) {
      throw new Error("Please switch to the Sepolia testnet");
    }
  }

  /**
   * Encodes buy swap data (ETH -> Temple Token) using proper V4 encoding
   */
  private encodeBuyData(amountIn: string, minAmountOut: bigint): SwapData {
    console.log('🔧 [DEBUG] Starting encodeBuyData with:', { amountIn, minAmountOut: minAmountOut.toString() });
    
    const poolKey = getPoolKey();
    console.log('🔧 [DEBUG] Pool key:', poolKey);
    
    const parsedAmountIn = parseEther(amountIn);
    console.log('🔧 [DEBUG] Parsed amount in (wei):', parsedAmountIn.toString());
    
    const zeroForOne = getSwapDirection(true); // ETH -> Temple Token
    console.log('🔧 [DEBUG] Swap direction zeroForOne:', zeroForOne);
    
    // Encode all components using utility functions
    const commands = encodeBuyCommands();
    console.log('🔧 [DEBUG] Encoded commands:', commands);
    
    const actions = encodeSwapActions();
    console.log('🔧 [DEBUG] Encoded actions:', actions);
    
    const swapParams = encodeSwapParams(poolKey, zeroForOne, amountIn, minAmountOut, false);
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
   * Executes a buy swap (ETH -> Temple Token) using real V4 transactions
   */
  async executeBuySwap(params: SwapParams): Promise<SwapResult> {
    try {
      console.log('🚀 [PRODUCTION DEBUG] Starting buy swap with full environment details:', {
        timestamp: new Date().toISOString(),
        chainId: await this.publicClient.getChainId(),
        rpcUrl: this.publicClient.transport?.url || 'unknown',
        universalRouter: UNIVERSAL_ROUTER_ADDRESS,
        permit2: PERMIT2_ADDRESS,
        templeToken: TEMPLE_TOKEN_ADDRESS,
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
      console.log('⛽ [GAS EST] Attempting gas estimation for buy swap...', {
        contract: UNIVERSAL_ROUTER_ADDRESS,
        function: 'execute',
        commands: commands,
        inputsCount: inputs.length,
        value: value.toString(),
        userAddress,
        timestamp: new Date().toISOString()
      });
      
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
        console.log('✅ [GAS EST] Gas estimation successful:', {
          gasEstimate: gasEstimate.toString(),
          gasEstimateGwei: (Number(gasEstimate) / 1e9).toFixed(2) + ' Gwei',
          timestamp: new Date().toISOString()
        });
      } catch (gasError) {
        console.error('❌ [GAS EST] Gas estimation failed:', {
          error: gasError instanceof Error ? gasError.message : "Unknown error",
          stack: gasError instanceof Error ? gasError.stack : undefined,
          errorType: gasError?.constructor?.name,
          errorCode: (gasError as any)?.code,
          errorData: (gasError as any)?.data,
          errorReason: (gasError as any)?.reason,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Gas estimation failed: ${(gasError as any).message}`);
      }

      const gasLimit = calculateGasWithBuffer(gasEstimate);

      console.log('💰 Executing Universal Router transaction...');

      // Execute transaction
      console.log('🚀 [TX SUBMIT] Submitting buy swap transaction:', {
        to: UNIVERSAL_ROUTER_ADDRESS,
        functionName: 'execute',
        args: {
          commands: commands,
          inputs: inputs.length,
          deadline: createDeadline().toString()
        },
        gasLimit: gasLimit.toString(),
        value: value.toString(),
        timestamp: new Date().toISOString()
      });

      const hash = await this.walletClient!.writeContract({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [commands, inputs, createDeadline()],
        gas: gasLimit,
        value,
      } as any);

      console.log('📝 [TX SENT] Buy swap transaction sent:', {
        hash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
        timestamp: new Date().toISOString()
      });

      // Wait for confirmation
      console.log('⏳ [TX WAIT] Waiting for transaction confirmation...');
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      console.log('✅ [TX COMPLETE] Buy swap transaction completed:', {
        hash,
        status: receipt.status,
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
        logs: receipt.logs.length,
        explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
        timestamp: new Date().toISOString()
      });

      return {
        hash,
        success: receipt.status === "success",
        error: receipt.status !== "success" ? "Transaction failed" : undefined
      };

    } catch (error) {
      console.error('❌ [TX FAILED] Buy swap transaction failed:', {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        params: {
          amountIn: params.amountIn,
          minAmountOut: params.minAmountOut.toString(),
          slippage: params.slippagePercent,
          userAddress: params.userAddress
        },
        timestamp: new Date().toISOString(),
        // Additional error details
        errorType: error?.constructor?.name,
        errorCode: (error as any)?.code,
        errorData: (error as any)?.data,
        errorReason: (error as any)?.reason,
      });

      return {
        hash: "0x0" as `0x${string}`,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Executes a sell swap (Temple Token -> ETH) with proper approvals and Permit2
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

      console.log('🔧 [AMOUNT PARSE] Parsing sell amount:', {
        rawAmountIn: params.amountIn,
        amountInType: typeof params.amountIn,
        amountInLength: params.amountIn.length,
        timestamp: new Date().toISOString()
      });

      const requiredAmount = parseEther(params.amountIn);

      console.log('🔧 [AMOUNT PARSE] Parsed sell amount:', {
        requiredAmount: requiredAmount.toString(),
        requiredAmountFormatted: `${(Number(requiredAmount) / 1e18).toFixed(6)} Temple`,
        timestamp: new Date().toISOString()
      });

      // Note: Allowing tiny amounts for testing purposes

      // Check Temple Token balance first
      if (await hasInsufficientTempleBalance(this.publicClient, userAddress, requiredAmount)) {
        throw new Error(`Insufficient Temple Token balance. Required: ${params.amountIn} Temple`);
      }

      // Check Temple Token allowance for Permit2
      if (await hasInsufficientTempleAllowance(this.publicClient, userAddress, requiredAmount)) {
        console.log('⚠️ Insufficient Temple Token allowance, requesting approval...');
        
        const approvalHash = await approveTempleForPermit2(this.walletClient!);
        if (!approvalHash) {
          throw new Error('Temple Token approval failed');
        }

        console.log('⏳ Waiting for Temple Token approval confirmation...');
        const approvalReceipt = await this.publicClient.waitForTransactionReceipt({ hash: approvalHash });
        
        if (approvalReceipt.status !== "success") {
          throw new Error('Temple Token approval transaction failed');
        }
        
        console.log('✅ Temple Token approved for Permit2');
      }

      // Get current nonce from Permit2 contract
      const [, , nonce] = await this.publicClient.readContract({
        address: PERMIT2_ADDRESS,
        abi: PERMIT2_ABI,
        functionName: "allowance",
        args: [userAddress, TEMPLE_TOKEN_ADDRESS, UNIVERSAL_ROUTER_ADDRESS],
      });

      // Create permit signature
      const deadline = createDeadline(10); // 10 minutes
      const permitMessage = {
        details: {
          token: TEMPLE_TOKEN_ADDRESS,
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
          chainId: 11155111, // Sepolia chain ID
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
          token: TEMPLE_TOKEN_ADDRESS,
          amount: requiredAmount,
          expiration: Number(deadline),
          nonce: Number(nonce)
        },
        sigDeadline: deadline
      };

      const minAmountOut = calculateMinAmountOut(params.minAmountOut, params.slippagePercent);
      
      // Encode sell swap with permit using proper V4 encoding
      const poolKey = getPoolKey();
      const zeroForOne = getSwapDirection(false); // Temple Token -> ETH
      
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
      const swapParams = encodeSwapParams(poolKey, zeroForOne, params.amountIn, minAmountOut, false); // Temple Token is 18 decimals, not USDC format
      const settleParams = encodeSettleParams(poolKey.currency1, requiredAmount);
      const takeParams = encodeTakeParams(poolKey.currency0, BigInt(0));
      
      const swapInputs = encodeRouterInputs(actions, [swapParams, settleParams, takeParams]);

      // Try to estimate gas, fallback to high limit if it fails
      console.log('⛽ [GAS EST] Attempting gas estimation for sell swap...', {
        contract: UNIVERSAL_ROUTER_ADDRESS,
        function: 'execute',
        commands: commands,
        inputsCount: 2, // permitInputs + swapInputs
        value: '0',
        userAddress,
        timestamp: new Date().toISOString()
      });
      
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
        
        console.log('✅ [GAS EST] Gas estimation successful for sell swap:', {
          gasEstimate: gasEstimate.toString(),
          gasEstimateGwei: (Number(gasEstimate) / 1e9).toFixed(2) + ' Gwei',
          timestamp: new Date().toISOString()
        });
        
        gasLimit = calculateGasWithBuffer(gasEstimate);
      } catch (gasError) {
        console.error('❌ [GAS EST] Gas estimation failed for sell swap, using fallback:', {
          error: gasError instanceof Error ? gasError.message : "Unknown error",
          errorType: gasError?.constructor?.name,
          errorCode: (gasError as any)?.code,
          errorData: (gasError as any)?.data,
          errorReason: (gasError as any)?.reason,
          fallbackGasLimit: '3000000',
          timestamp: new Date().toISOString()
        });
        
        // Fallback to high gas limit if estimation fails
        gasLimit = BigInt(3000000);
      }

      console.log('💰 Executing Universal Router sell transaction...');

      // Execute transaction
      console.log('🚀 [TX SUBMIT] Submitting sell swap transaction:', {
        to: UNIVERSAL_ROUTER_ADDRESS,
        functionName: 'execute',
        args: {
          commands: commands,
          inputs: 2, // permitInputs + swapInputs
          deadline: createDeadline().toString()
        },
        gasLimit: gasLimit.toString(),
        value: '0',
        permit: {
          token: permit.details.token,
          amount: permit.details.amount.toString(),
          expiration: permit.details.expiration,
          nonce: permit.details.nonce
        },
        timestamp: new Date().toISOString()
      });

      const hash = await this.walletClient!.writeContract({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [commands, [permitInputs, swapInputs], createDeadline()],
        gas: gasLimit,
        value: BigInt(0),
      } as any);

      console.log('📝 [TX SENT] Sell swap transaction sent:', {
        hash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
        timestamp: new Date().toISOString()
      });

      // Wait for confirmation
      console.log('⏳ [TX WAIT] Waiting for transaction confirmation...');
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      console.log('✅ [TX COMPLETE] Sell swap transaction completed:', {
        hash,
        status: receipt.status,
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
        logs: receipt.logs.length,
        explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
        timestamp: new Date().toISOString()
      });

      return {
        hash,
        success: receipt.status === "success",
        error: receipt.status !== "success" ? "Transaction failed" : undefined
      };

    } catch (error) {
      console.error('❌ [TX FAILED] Sell swap transaction failed:', {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        params: {
          amountIn: params.amountIn,
          minAmountOut: params.minAmountOut.toString(),
          slippage: params.slippagePercent,
          userAddress
        },
        timestamp: new Date().toISOString(),
        // Additional error details
        errorType: error?.constructor?.name,
        errorCode: (error as any)?.code,
        errorData: (error as any)?.data,
        errorReason: (error as any)?.reason,
        // Permit-specific debugging
        permitDetails: (error as any)?.permitDetails,
      });

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