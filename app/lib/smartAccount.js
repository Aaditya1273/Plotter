import {
  createPublicClient,
  http,
  encodeFunctionData,
  parseEther,
} from "viem";
import { sepolia } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";

// Sepolia Configuration
const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const SEPOLIA_CHAIN_ID = 11155111;

// Token addresses
const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";

// Get or create session key from localStorage
function getSessionKey(eoaAddress) {
  if (typeof window === "undefined" || !eoaAddress) return null;
  
  let privKey = localStorage.getItem(`metaArmy_session_key_${eoaAddress}`);
  if (!privKey) {
    privKey = generatePrivateKey();
    localStorage.setItem(`metaArmy_session_key_${eoaAddress}`, privKey);
    console.log("[SA] 🔑 Generated new session key for", eoaAddress);
  }
  
  return privateKeyToAccount(privKey);
}

export async function createSessionAccount(publicClient, eoaAddress) {
  console.log("[SA] 🎫 Creating Session Account...");
  
  const account = getSessionKey(eoaAddress);
  if (!account) throw new Error("Failed to create session key");
  
  console.log("[SA] 🔑 Session key address:", account.address);

  const sessionAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [account.address, [], [], []],
    deploySalt: "0x",
    signer: { account },
  });

  console.log("[SA] ✅ Session Account created:", sessionAccount.address);
  return sessionAccount;
}

export async function grantPermissions(sessionAccount, walletClient, chainId) {
  console.log("[SA] 📜 Granting permissions...");
  
  if (!sessionAccount) {
    throw new Error("Session account not found");
  }

  if (!walletClient) {
    throw new Error("Wallet client not connected");
  }

  try {
    const client = walletClient.extend(erc7715ProviderActions());
    const currentTime = Math.floor(Date.now() / 1000);
    const expiry = currentTime + 24 * 60 * 60 * 30; // 30 days

    // USDC address on Sepolia
    const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";

    const permissions = await client.requestExecutionPermissions([
      // ETH Permission
      {
        chainId: chainId || SEPOLIA_CHAIN_ID,
        expiry,
        signer: {
          type: "account",
          data: {
            address: sessionAccount.address,
          },
        },
        isAdjustmentAllowed: true,
        permission: {
          type: "native-token-periodic",
          data: {
            periodAmount: 100000000000000000n, // 0.1 ETH
            periodDuration: 3600, // 1 hour
            justification: "MetaArmy ETH transfers",
          },
        },
      },
      // USDC Permission
      {
        chainId: chainId || SEPOLIA_CHAIN_ID,
        expiry,
        signer: {
          type: "account",
          data: {
            address: sessionAccount.address,
          },
        },
        isAdjustmentAllowed: true,
        permission: {
          type: "erc20-token-periodic",
          data: {
            tokenAddress: USDC_ADDRESS,
            periodAmount: 10000000n, // 10 USDC (6 decimals)
            periodDuration: 3600, // 1 hour
            justification: "MetaArmy USDC transfers",
          },
        },
      },
    ]);

    console.log("[SA] ✅ Permissions granted!");
    console.log("[SA] ETH Permission:", permissions[0]);
    console.log("[SA] USDC Permission:", permissions[1]);
    
    return {
      eth: permissions[0],
      usdc: permissions[1],
    };
  } catch (error) {
    console.error("[SA] ❌ Permission grant failed:", error);
    throw error;
  }
}

export async function initSmartAccountContext(publicClient, eoaAddress) {
  console.log("[SA] 🏗️ Init Smart Account Context...");

  const sessionAccount = await createSessionAccount(publicClient, eoaAddress);

  console.log("[SA] 📦 Setup Bundler & Pimlico...");
  const { createBundlerClient } = await import('viem/account-abstraction');
  const { erc7710BundlerActions } = await import('@metamask/smart-accounts-kit/actions');
  const { createPimlicoClient } = await import('permissionless/clients/pimlico');

  const pimlicoKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
  if (!pimlicoKey) {
    throw new Error("Pimlico API key not found");
  }

  const bundlerClient = createBundlerClient({
    transport: http(`https://api.pimlico.io/v2/${SEPOLIA_CHAIN_ID}/rpc?apikey=${pimlicoKey}`),
    paymaster: true,
  }).extend(erc7710BundlerActions());

  const pimlicoClient = createPimlicoClient({
    transport: http(`https://api.pimlico.io/v2/${SEPOLIA_CHAIN_ID}/rpc?apikey=${pimlicoKey}`),
  });

  console.log("[SA] 🎉 Context ready!");

  return {
    sessionAccount,
    bundlerClient,
    pimlicoClient,
    publicClient,
    address: sessionAccount.address,
  };
}

export async function executeTransfer(ctx, permission, { to, amount, token }) {
  console.log("[Transfer] 🚀 Executing ERC-7715 transfer...");
  console.log("[Transfer] Token:", token);
  console.log("[Transfer] To:", to);
  console.log("[Transfer] Amount:", amount);

  const { bundlerClient, pimlicoClient, sessionAccount, publicClient } = ctx;

  if (!permission) {
    throw new Error("No permission granted");
  }

  try {
    const { context, signerMeta } = permission;

    if (!signerMeta || !context) {
      throw new Error("Invalid permission data");
    }

    const { delegationManager } = signerMeta;

    // Get gas prices
    const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();
    console.log("[Transfer] ⛽ Gas:", String(fee.maxFeePerGas));

    let callData = "0x";
    let targetAddress = to;
    let value = 0n;

    if (token === "ETH") {
      // Native ETH transfer
      value = amount;
    } else {
      // ERC20 transfer
      targetAddress = token;
      const transferAbi = [{
        name: "transfer",
        type: "function",
        inputs: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" }
        ],
      }];
      
      callData = encodeFunctionData({
        abi: transferAbi,
        functionName: "transfer",
        args: [to, amount],
      });
    }

    // Send transaction using ERC-7715 delegation
    console.log("[Transfer] 🚀 Sending ERC-7715 delegated transaction...");
    const hash = await bundlerClient.sendUserOperationWithDelegation({
      publicClient,
      account: sessionAccount,
      calls: [{
        to: targetAddress,
        data: callData,
        value,
        permissionsContext: context,
        delegationManager,
      }],
      ...fee,
    });

    console.log("[Transfer] ✅ UserOp Hash:", hash);

    const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash });
    console.log("[Transfer] ✅ Transaction:", receipt.transactionHash);

    return {
      hash,
      txHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error("[Transfer] ❌ Failed:", error);
    throw error;
  }
}

// Pure ERC-7715 implementation - no custom contract needed