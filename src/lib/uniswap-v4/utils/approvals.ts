/**
 * ERC-20 Token Approval Utilities for Uniswap V4
 */

import { PublicClient, WalletClient, parseEther } from "viem";
import { PERMIT2_ADDRESS, TEMPLE_TOKEN_ADDRESS } from "../contracts/addresses";
import { ERC20_ABI } from "../contracts/abis";

/**
 * Checks current Temple Token allowance for Permit2
 */
export async function checkTempleAllowance(
  publicClient: PublicClient,
  userAddress: `0x${string}`
): Promise<bigint> {
  try {
    const allowance = await publicClient.readContract({
      address: TEMPLE_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [userAddress, PERMIT2_ADDRESS],
    });
    
    return allowance as bigint;
  } catch (error) {
    console.error("Error checking Temple Token allowance:", error);
    return BigInt(0);
  }
}

/**
 * Checks Temple Token balance for user
 */
export async function checkTempleBalance(
  publicClient: PublicClient,
  userAddress: `0x${string}`
): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: TEMPLE_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    });
    
    return balance as bigint;
  } catch (error) {
    console.error("Error checking Temple Token balance:", error);
    return BigInt(0);
  }
}

/**
 * Approves Temple Token spending for Permit2 (required for selling Temple Token)
 */
export async function approveTempleForPermit2(
  walletClient: WalletClient,
  amount: bigint = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") // Max approval
): Promise<`0x${string}` | null> {
  try {
    const [userAddress] = await walletClient.getAddresses();
    
    console.log("🔄 Approving Temple Token for Permit2...");
    
    const hash = await walletClient.writeContract({
      address: TEMPLE_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [PERMIT2_ADDRESS, amount],
    });

    console.log("✅ Temple Token approval transaction sent:", hash);
    return hash;
  } catch (error) {
    console.error("❌ Temple Token approval failed:", error);
    return null;
  }
}

/**
 * Checks if user has sufficient Temple Token allowance for a transaction
 */
export async function hasInsufficientTempleAllowance(
  publicClient: PublicClient,
  userAddress: `0x${string}`,
  requiredAmount: bigint
): Promise<boolean> {
  const currentAllowance = await checkTempleAllowance(publicClient, userAddress);
  return currentAllowance < requiredAmount;
}

/**
 * Checks if user has sufficient Temple Token balance for a transaction
 */
export async function hasInsufficientTempleBalance(
  publicClient: PublicClient,
  userAddress: `0x${string}`,
  requiredAmount: bigint
): Promise<boolean> {
  const currentBalance = await checkTempleBalance(publicClient, userAddress);
  return currentBalance < requiredAmount;
}

/**
 * Gets formatted Temple Token balance (18 decimals)
 */
export function formatTempleAmount(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(6);
}

/**
 * Converts Temple Token amount to wei (18 decimals)
 */
export function parseTempleAmount(amount: string): bigint {
  return parseEther(amount);
}