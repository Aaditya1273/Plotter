MetaMask Smart Accounts quickstart
You can get started quickly with MetaMask Smart Accounts by creating your first smart account and sending a user operation.

Prerequisites
Install Node.js v18 or later.
Install Yarn, npm, or another package manager.
Steps
1. Install the Smart Accounts Kit
Install the Smart Accounts Kit:

npm
Yarn
pnpm
Bun
npm install @metamask/smart-accounts-kit
2. Set up a Public Client
Set up a Viem Public Client using Viem's createPublicClient function. This client will let the smart account query the signer's account state and interact with the blockchain network.

import { createPublicClient, http } from "viem";
import { sepolia as chain } from "viem/chains";

const publicClient = createPublicClient({
  chain,
  transport: http(),
});
3. Set up a Bundler Client
Set up a Viem Bundler Client using Viem's createBundlerClient function. This lets you use the bundler service to estimate gas for user operations and submit transactions to the network.

import { createBundlerClient } from "viem/account-abstraction";

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http("https://your-bundler-rpc.com"),
});
4. Create a MetaMask smart account
Create a MetaMask smart account to send the first user operation.

This example configures a Hybrid smart account, which is a flexible smart account implementation that supports both an externally owned account (EOA) owner and any number of passkey (WebAuthn) signers:

import { Implementation, toMetaMaskSmartAccount } from "@metamask/smart-accounts-kit";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0x...");

const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [account.address, [], [], []],
  deploySalt: "0x",
  signer: { account },
});
5. Send a user operation
Send a user operation using Viem's sendUserOperation method.

See Send a user operation to learn how to estimate fee per gas, and wait for the transaction receipt.

The smart account will remain counterfactual until the first user operation. If the smart account is not deployed, it will be automatically deployed upon the sending first user operation.

import { parseEther } from "viem";

// Appropriate fee per gas must be determined for the specific bundler being used.
const maxFeePerGas = 1n;
const maxPriorityFeePerGas = 1n;

const userOperationHash = await bundlerClient.sendUserOperation({
  account: smartAccount,
  calls: [
    {
      to: "0x1234567890123456789012345678901234567890",
      value: parseEther("1"),
    },
  ],
  maxFeePerGas,
  maxPriorityFeePerGas,
});
Next steps
To grant specific permissions to other accounts from your smart account, create a delegation.
This quickstart example uses a Hybrid smart account. You can also configure other smart account types.
To upgrade an EOA to a smart account, see the EIP-7702 quickstart.
To quickly bootstrap a MetaMask Smart Accounts project, use the CLI.



Use the Smart Accounts Kit CLI
Use the @metamask/create-gator-app interactive CLI to bootstrap a project with the Smart Accounts Kit in under two minutes. The CLI automatically installs the required dependencies and sets up a project structure using a selected template, allowing you to focus on building your dapp.

Run the CLI
Run the following command to automatically install the @metamask/create-gator-app package:

npx @metamask/create-gator-app@latest
Upon installation, you'll be asked the following prompts:

? What is your project named? (my-gator-app)
? Pick a framework: (Use arrow keys) 
❯ nextjs
  vite-react
? Pick a template: (Use arrow keys)
❯ MetaMask Smart Accounts Starter
  MetaMask Smart Accounts & Delegation Starter
  Farcaster Mini App Delegation Starter 
  Advanced Permissions (ERC-7715) Starter
? Pick a package manager: (Use arrow keys)
❯ npm 
  yarn 
  pnpm 
Once you've answered the prompts with the required configuration and selected a template, the CLI will create the project using the specified name and settings. See the following section to learn more about available CLI configurations.

Options
The CLI provides the following options to display CLI details, and further customize the template configuration.

Option	Description
-v or --version	Check the current version of the @metamask/create-gator-app CLI.
-h or --help	Display the available options.
--skip-install	Skip the installation of dependencies.
--add-web3auth	Add MetaMask Embedded Wallets (previously Web3Auth) as a signer for the delegator account.
Supported templates:
- MetaMask Smart Accounts Starter
- MetaMask Smart Accounts & Delegation Starter
Examples
MetaMask Embedded Wallets configuration
To create a project that uses MetaMask Embedded Wallets as the signer for your delegator account, use the --add-web3auth option with @metamask/create-gator-app:

npx @metamask/create-gator-app --add-web3auth
You'll be prompted to provide additional Web3Auth configuration details:

? Which Web3Auth network do you want to use? (Use arrow keys)
❯ Sapphire Devnet 
  Sapphire Mainnet 
Supported templates
Template	Next.js	Vite React
MetaMask Smart Accounts Starter	✅	✅
MetaMask Smart Accounts & Delegation Starter	✅	✅
Farcaster Mini App Delegation Starter	✅	
Advanced Permissions (ERC-7715) Starter	✅	
Edit this page



Perform executions on a MetaMask user's behalf
Advanced Permissions (ERC-7115) are fine-grained permissions that your dapp can request from a MetaMask user to execute transactions on their behalf. For example, a user can grant your dapp permission to spend 10 USDC per day to buy ETH over the course of a month. Once the permission is granted, your dapp can use the allocated 10 USDC each day to purchase ETH directly from the MetaMask user's account.

In this guide, you'll request an ERC-20 periodic transfer permission from a MetaMask user to transfer 1 USDC every day on their behalf.

Prerequisites
Install and set up the Smart Accounts Kit
Install MetaMask Flask 13.5.0 or later
Steps
1. Set up a Wallet Client
Set up a Viem Wallet Client using Viem's createWalletClient function. This client will help you interact with MetaMask Flask.

Then, extend the Wallet Client functionality using erc7715ProviderActions. These actions enable you to request Advanced Permissions from the user.

import { createWalletClient, custom } from "viem";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";

const walletClient = createWalletClient({
  transport: custom(window.ethereum),
}).extend(erc7715ProviderActions());
2. Set up a Public Client
Set up a Viem Public Client using Viem's createPublicClient function. This client will help you query the account state and interact with the blockchain network.

import { createPublicClient, http } from "viem";
import { sepolia as chain } from "viem/chains";
 
const publicClient = createPublicClient({
  chain,
  transport: http(),
});
3. Set up a session account
Set up a session account which can either be a smart account or an externally owned account (EOA) to request Advanced Permissions. The requested permissions are granted to the session account, which is responsible for executing transactions on behalf of the user.

Smart account
EOA
import { privateKeyToAccount } from "viem/accounts";
import { 
  toMetaMaskSmartAccount, 
  Implementation 
} from "@metamask/smart-accounts-kit";

const privateKey = "0x...";
const account = privateKeyToAccount(privateKey);

const sessionAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [account.address, [], [], []],
  deploySalt: "0x",
  signer: { account },
});
4. Check the EOA account code
With MetaMask Flask 13.9.0 or later, Advanced Permissions support automatically upgrading a user’s account to a MetaMask smart account. On earlier versions, upgrade the user to a smart account before requesting Advanced Permissions.

If the user has not yet been upgraded, you can handle the upgrade programmatically or ask the user to switch to a smart account manually.

Why is a Smart Account upgrade is required?
MetaMask's Advanced Permissions (ERC-7115) implementation requires the user to be upgraded to a MetaMask Smart Account because, under the hood, you're requesting a signature for an ERC-7710 delegation. ERC-7710 delegation is one of the core features supported only by MetaMask Smart Accounts.

import { getSmartAccountsEnvironment } from "@metamask/smart-accounts-kit";
import { sepolia as chain } from "viem/chains";

const addresses = await walletClient.requestAddresses();
const address = addresses[0];

// Get the EOA account code
const code = await publicClient.getCode({
  address,
});

if (code) {
  // The address to which EOA has delegated. According to EIP-7702, 0xef0100 || address
  // represents the delegation. 
  // 
  // You need to remove the first 8 characters (0xef0100) to get the delegator address.
  const delegatorAddress = `0x${code.substring(8)}`;

  const statelessDelegatorAddress = getSmartAccountsEnvironment(chain.id)
  .implementations
  .EIP7702StatelessDeleGatorImpl;

  // If account is not upgraded to MetaMask smart account, you can
  // either upgrade programmatically or ask the user to switch to a smart account manually.
  const isAccountUpgraded = delegatorAddress.toLowerCase() === statelessDelegatorAddress.toLowerCase();
}
5. Request Advanced Permissions
Request Advanced Permissions from the user with the Wallet Client's requestExecutionPermissions action. In this example, you'll request an ERC-20 periodic permission.

See the requestExecutionPermissions API reference for more information.

import { sepolia as chain } from "viem/chains";
import { parseUnits } from "viem";

// Since current time is in seconds, we need to convert milliseconds to seconds.
const currentTime = Math.floor(Date.now() / 1000);
// 1 week from now.
const expiry = currentTime + 604800;

// USDC address on Ethereum Sepolia.
const tokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const grantedPermissions = await walletClient.requestExecutionPermissions([{
  chainId: chain.id,
  expiry,
  signer: {
    type: "account",
    data: {
      // The requested permissions will granted to the
      // session account.
      address: sessionAccount.address,
    },
  },
  permission: {
    type: "erc20-token-periodic",
    data: {
      tokenAddress,
      // 1 USDC in WEI format. Since USDC has 6 decimals, 10 * 10^6
      periodAmount: parseUnits("10", 6),
      // 1 day in seconds
      periodDuration: 86400,
      justification?: "Permission to transfer 1 USDC every day",
    },
  },
  isAdjustmentAllowed: true,
}]);
6. Set up a Viem client
Set up a Viem client depending on your session account type.

For a smart account, set up a Viem Bundler Client using Viem's createBundlerClient function. This lets you use the bundler service to estimate gas for user operations and submit transactions to the network.

For an EOA, set up a Viem Wallet Client using Viem's createWalletClient function. This lets you send transactions directly to the network.

The toolkit provides public actions for both of the clients which can be used to redeem Advanced Permissions, and execute transactions on a user's behalf.

Smart account
EOA
import { createBundlerClient } from "viem/account-abstraction";
import { erc7710BundlerActions } from "@metamask/smart-accounts-kit/actions";

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http("https://your-bundler-rpc.com"),
  // Allows you to use the same Bundler Client as paymaster.
  paymaster: true
}).extend(erc7710BundlerActions());
7. Redeem Advanced Permissions
The session account can now redeem the permissions. The redeem transaction is sent to the DelegationManager contract, which validates the delegation and executes actions on the user's behalf.

To redeem the permissions, use the client action based on your session account type. A smart account uses the Bundler Client's sendUserOperationWithDelegation action, and an EOA uses the Wallet Client's sendTransactionWithDelegation action.

See the sendUserOperationWithDelegation and sendTransactionWithDelegation API reference for more information.

Smart account
EOA
config.ts
import { calldata } from "./config.ts";

// These properties must be extracted from the permission response.
const permissionsContext = grantedPermissions[0].context;
const delegationManager = grantedPermissions[0].signerMeta.delegationManager;

// USDC address on Ethereum Sepolia.
const tokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// Calls without permissionsContext and delegationManager will be executed 
// as a normal user operation.
const userOperationHash = await bundlerClient.sendUserOperationWithDelegation({
  publicClient,
  account: sessionAccount,
  calls: [
    {
      to: tokenAddress,
      data: calldata,
      permissionsContext,
      delegationManager,
    },
  ],
  // Appropriate values must be used for fee-per-gas. 
  maxFeePerGas: 1n,
  maxPriorityFeePerGas: 1n,
});
Next steps
See how to configure different ERC-20 token permissions and native token permissions.




Use ERC-20 token permissions
Advanced Permissions (ERC-7715) supports ERC-20 token permission types that allow you to request fine-grained permissions for ERC-20 token transfers with time-based (periodic) or streaming conditions, depending on your use case.

Prerequisites
Install and set up the Smart Accounts Kit
Configure the Smart Accounts Kit
Create a session account
ERC-20 periodic permission
This permission type ensures a per-period limit for ERC-20 token transfers. At the start of each new period, the allowance resets.

For example, a user signs an ERC-7715 permission that lets a dapp spend up to 10 USDC on their behalf each day. The dapp can transfer a total of 10 USDC per day; the limit resets at the beginning of the next day.

See the ERC-20 periodic permission API reference for more information.

example.ts
client.ts
import { sepolia as chain } from "viem/chains";
import { parseUnits } from "viem";
import { walletClient } from "./client.ts"

// Since current time is in seconds, convert milliseconds to seconds.
const currentTime = Math.floor(Date.now() / 1000);
// 1 week from now.
const expiry = currentTime + 604800;

// USDC address on Ethereum Sepolia.
const tokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const grantedPermissions = await walletClient.requestExecutionPermissions([{
  chainId: chain.id,
  expiry,
  signer: {
    type: "account",
    data: {
      // Session account created as a prerequisite.
      //
      // The requested permissions will granted to the
      // session account.
      address: sessionAccountAddress,
    },
  },
  permission: {
    type: "erc20-token-periodic",
    data: {
      tokenAddress,
      // 10 USDC in WEI format. Since USDC has 6 decimals, 10 * 10^6.
      periodAmount: parseUnits("10", 6),
      // 1 day in seconds.
      periodDuration: 86400,
      justification?: "Permission to transfer 1 USDC every day",
    },
  },
  isAdjustmentAllowed: true,
}]);
ERC-20 stream permission
This permission type ensures a linear streaming transfer limit for ERC-20 tokens. Token transfers are blocked until the defined start timestamp. At the start, a specified initial amount is released, after which tokens accrue linearly at the configured rate, up to the maximum allowed amount.

For example, a user signs an ERC-7715 permission that allows a dapp to spend 0.1 USDC per second, starting with an initial amount of 1 USDC, up to a maximum of 2 USDC.

See the ERC-20 stream permission API reference for more information.

example.ts
client.ts
import { sepolia as chain } from "viem/chains";
import { parseUnits } from "viem";
import { walletClient } from "./client.ts"

// Since current time is in seconds, convert milliseconds to seconds.
const currentTime = Math.floor(Date.now() / 1000);
// 1 week from now.
const expiry = currentTime + 604800;

// USDC address on Ethereum Sepolia.
const tokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const grantedPermissions = await walletClient.requestExecutionPermissions([{
  chainId: chain.id,
  expiry,
  signer: {
    type: "account",
    data: {
      // Session account created as a prerequisite.
      //
      // The requested permissions will granted to the
      // session account.
      address: sessionAccountAddress,
    },
  },
  permission: {
    type: "erc20-token-stream",
    data: {
      tokenAddress,
      // 0.1 USDC in WEI format. Since USDC has 6 decimals, 0.1 * 10^6.
      amountPerSecond: parseUnits("0.1", 6),
      // 1 USDC in WEI format. Since USDC has 6 decimals, 1 * 10^6.
      initialAmount: parseUnits("1", 6),
      // 2 USDC in WEI format. Since USDC has 6 decimals, 2 * 10^6.
      maxAmount: parseUnits("2", 6),
      startTime: currentTime,
      justification: "Permission to use 0.1 USDC per second",
    },
  },
  isAdjustmentAllowed: true,
}]);
Edit this page




Use native token permissions
Advanced Permissions (ERC-7115) supports native token permission types that allow you to request fine-grained permissions for native token transfers with time-based (periodic) or streaming conditions, depending on your use case.

Prerequisites
Install and set up the Smart Accounts Kit
Configure the Smart Accounts Kit
Create a session account
Native token periodic permission
This permission type ensures a per-period limit for native token transfers. At the start of each new period, the allowance resets.

For example, a user signs an ERC-7715 permission that lets a dapp spend up to 0.001 ETH on their behalf each day. The dapp can transfer a total of 0.001 USDC per day; the limit resets at the beginning of the next day.

See the native token periodic permission API reference for more information.

example.ts
client.ts
import { sepolia as chain } from "viem/chains";
import { parseEther } from "viem";
import { walletClient } from "./client.ts"

// Since current time is in seconds, convert milliseconds to seconds.
const currentTime = Math.floor(Date.now() / 1000);
// 1 week from now.
const expiry = currentTime + 604800;

const grantedPermissions = await walletClient.requestExecutionPermissions([{
  chainId: chain.id,
  expiry,
  signer: {
    type: "account",
    data: {
      // Session account created as a prerequisite.
      //
      // The requested permissions will granted to the
      // session account.
      address: sessionAccountAddress,
    },
  },
  permission: {
    type: "native-token-periodic",
    data: {
      // 0.001 ETH in wei format.
      periodAmount: parseEther("0.001"),
      // 1 hour in seconds.
      periodDuration: 86400,
      startTime: currentTime,
      justification: "Permission to use 0.001 ETH every day",
    },
  },
  isAdjustmentAllowed: true,
}]);
Native token stream permission
This permission type ensures a linear streaming transfer limit for native tokens. Token transfers are blocked until the defined start timestamp. At the start, a specified initial amount is released, after which tokens accrue linearly at the configured rate, up to the maximum allowed amount.

For example, a user signs an ERC-7715 permission that allows a dapp to spend 0.0001 ETH per second, starting with an initial amount of 0.1 ETH, up to a maximum of 1 ETH.

See the native token stream permission API reference for more information.

example.ts
client.ts
import { sepolia as chain } from "viem/chains";
import { parseEther } from "viem";
import { walletClient } from "./client.ts"

// Since current time is in seconds, convert milliseconds to seconds.
const currentTime = Math.floor(Date.now() / 1000);
// 1 week from now.
const expiry = currentTime + 604800;

const grantedPermissions = await walletClient.requestExecutionPermissions([{
  chainId: chain.id,
  expiry,
  signer: {
    type: "account",
    data: {
      // Session account created as a prerequisite.
      //
      // The requested permissions will granted to the
      // session account.
      address: sessionAccountAddress,
    },
  },
  permission: {
    type: "native-token-stream",
    data: {
      // 0.0001 ETH in wei format.
      amountPerSecond: parseEther("0.0001"),
      // 0.1 ETH in wei format.
      initialAmount: parseEther("0.1"),
      // 1 ETH in wei format.
      maxAmount: parseEther("1"),
      startTime: currentTime,
      justification: "Permission to use 0.0001 ETH per second",
    },
  },
  isAdjustmentAllowed: true,
}]);
