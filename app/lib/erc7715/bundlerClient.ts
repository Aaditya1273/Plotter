import { createBundlerClient } from "viem/account-abstraction";
import { erc7710BundlerActions } from "@metamask/smart-accounts-kit/actions";
import { http } from "viem";

const pimlicoKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;

if (!pimlicoKey) {
  console.warn("Pimlico API key is not set - bundler client will not work");
}

/**
 * A configured bundler client for ERC-7710 account abstraction operations.
 * Uses Pimlico's bundler service on the specified chain.
 * Extends the base bundler client with ERC-7710 specific actions for delegation.
 * 
 * @param chainId - The chain ID to connect to (e.g., 11155111 for Sepolia)
 * @returns Bundler client with ERC-7710 delegation actions
 */
export const bundlerClient = (chainId: number) => createBundlerClient({
  transport: http(
    `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${pimlicoKey}`
  ),
  paymaster: true,
}).extend(erc7710BundlerActions());

/**
 * Get the bundler client for Sepolia testnet (chainId: 11155111)
 */
export const sepoliaBundlerClient = () => bundlerClient(11155111);
