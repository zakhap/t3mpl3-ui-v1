/**
 * ERC-20 Token Approval Utilities for Uniswap V4
 */

import { PublicClient, WalletClient, parseEther } from "viem";
import { PERMIT2_ADDRESS, USDC_ADDRESS } from "../contracts/addresses";
import { ERC20_ABI } from "../contracts/abis";

/**
 * Checks current USDC allowance for Permit2
 */
export async function checkUSDCAllowance(
  publicClient: PublicClient,
  userAddress: `0x${string}`
): Promise<bigint> {
  try {
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [userAddress, PERMIT2_ADDRESS],
    });
    
    return allowance as bigint;
  } catch (error) {
    console.error("Error checking USDC allowance:", error);
    return BigInt(0);
  }
}

/**
 * Checks USDC balance for user
 */
export async function checkUSDCBalance(
  publicClient: PublicClient,
  userAddress: `0x${string}`
): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    });
    
    return balance as bigint;
  } catch (error) {
    console.error("Error checking USDC balance:", error);
    return BigInt(0);
  }
}

/**
 * Approves USDC spending for Permit2 (required for selling USDC)
 */
export async function approveUSDCForPermit2(
  walletClient: WalletClient,
  amount: bigint = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") // Max approval
): Promise<`0x${string}` | null> {
  try {
    const [userAddress] = await walletClient.getAddresses();
    
    console.log("🔄 Approving USDC for Permit2...");
    
    const hash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [PERMIT2_ADDRESS, amount],
    });

    console.log("✅ USDC approval transaction sent:", hash);
    return hash;
  } catch (error) {
    console.error("❌ USDC approval failed:", error);
    return null;
  }
}

/**
 * Checks if user has sufficient USDC allowance for a transaction
 */
export async function hasInsufficientUSDCAllowance(
  publicClient: PublicClient,
  userAddress: `0x${string}`,
  requiredAmount: bigint
): Promise<boolean> {
  const currentAllowance = await checkUSDCAllowance(publicClient, userAddress);
  return currentAllowance < requiredAmount;
}

/**
 * Checks if user has sufficient USDC balance for a transaction
 */
export async function hasInsufficientUSDCBalance(
  publicClient: PublicClient,
  userAddress: `0x${string}`,
  requiredAmount: bigint
): Promise<boolean> {
  const currentBalance = await checkUSDCBalance(publicClient, userAddress);
  return currentBalance < requiredAmount;
}

/**
 * Gets formatted USDC balance (6 decimals)
 */
export function formatUSDCAmount(amount: bigint): string {
  return (Number(amount) / 1e6).toFixed(2);
}

/**
 * Converts USDC amount to wei (6 decimals)
 */
export function parseUSDCAmount(amount: string): bigint {
  return BigInt(Math.floor(Number(amount) * 1e6));
}