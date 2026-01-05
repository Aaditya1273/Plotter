import { createPimlicoClient } from "permissionless/clients/pimlico";
import { http } from "viem";

const pimlicoKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;

if (!pimlicoKey) {
    console.warn("Pimlico API key is not set - pimlico client will not work");
}

/**
 * Pimlico client for gas price estimation and paymaster services.
 * Used for estimating gas prices (maxFeePerGas, maxPriorityFeePerGas)
 * when sending UserOperations.
 * 
 * @param chainId - The chain ID to connect to (e.g., 11155111 for Sepolia)
 * @returns Pimlico client for gas estimation
 */
export const pimlicoClient = (chainId: number) => createPimlicoClient({
    transport: http(
        `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${pimlicoKey}`
    ),
});

/**
 * Get the Pimlico client for Sepolia testnet (chainId: 11155111)
 */
export const sepoliaPimlicoClient = () => pimlicoClient(11155111);
