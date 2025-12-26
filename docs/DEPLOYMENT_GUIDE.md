# 🚀 Meta-Plot AI Deployment Guide

## Prerequisites

### 1. Get Required API Keys

**WalletConnect Project ID** (Required)
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID

**Infura API Key** (Required for Sepolia)
1. Go to [Infura](https://infura.io/)
2. Create a new project
3. Copy the Project ID from the Ethereum section

**Etherscan API Key** (Optional, for contract verification)
1. Go to [Etherscan](https://etherscan.io/apis)
2. Create a free account
3. Generate an API key

### 2. Get Sepolia Testnet ETH
1. Go to [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your wallet address
3. Get free testnet ETH for deployment

### 3. Prepare Your Wallet
1. Create a new wallet for deployment (never use your main wallet)
2. Export the private key (keep it secure!)
3. Add Sepolia network to MetaMask

## Step-by-Step Deployment

### 1. Install Dependencies
```bash
cd Meta-Plot-AI
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
```env
# Required
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_ACTUAL_INFURA_KEY
PRIVATE_KEY=your_deployment_wallet_private_key

# Optional
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Compile Contracts
```bash
npm run compile
```

### 4. Deploy to Sepolia
```bash
npm run deploy
```

This will:
- Deploy the MetaPlotAgent contract
- Verify it on Etherscan (if API key provided)
- Update your `.env.local` with the new contract address
- Show you the deployment summary

### 5. Update Frontend Constants
After deployment, update `app/lib/constants.ts` with your new contract address:

```typescript
export const CONTRACTS = {
  META_PLOT_AGENT: 'YOUR_DEPLOYED_CONTRACT_ADDRESS', // From deployment output
  AAVE_POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951', // Real Aave Sepolia
  USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // Real USDC Sepolia
} as const
```

### 6. Set Up Envio Indexer

**Update Envio Config**
Edit `envio/config.yaml` with your deployed contract address:
```yaml
contracts:
  - name: MetaPlotAgent
    address: "YOUR_DEPLOYED_CONTRACT_ADDRESS" # Replace with actual address
```

**Deploy Envio Indexer**
```bash
cd envio
envio deploy
```

This will give you a GraphQL endpoint URL. Update your `.env.local`:
```env
NEXT_PUBLIC_ENVIO_ENDPOINT=https://indexer.bigdevenergy.link/YOUR_INDEXER/v1/graphql
```

### 7. Start Development Server
```bash
npm run dev
```

## Real Sepolia Addresses

These are the actual addresses you should use:

### Aave V3 Sepolia
- **Pool**: `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`
- **Pool Data Provider**: `0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654`

### Tokens on Sepolia
- **USDC**: `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8`
- **DAI**: `0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357`
- **WETH**: `0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c`

### Faucets for Test Tokens
- **USDC Faucet**: [Aave Faucet](https://staging.aave.com/faucet/)
- **General Sepolia Faucet**: [Sepolia Faucet](https://sepoliafaucet.com/)

## Verification Steps

### 1. Contract Verification
After deployment, verify your contract is working:
```bash
# Check contract on Etherscan
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

### 2. Frontend Testing
1. Connect MetaMask to Sepolia
2. Get test USDC from Aave faucet
3. Try the chat interface
4. Verify permissions are created

### 3. Envio Testing
1. Check GraphQL playground: `YOUR_ENVIO_ENDPOINT`
2. Query for permissions and activities
3. Verify real-time updates

## Troubleshooting

### Common Issues

**"Insufficient funds for gas"**
- Get more Sepolia ETH from faucet
- Check your wallet has ETH on Sepolia network

**"Contract deployment failed"**
- Check your private key is correct
- Verify Infura RPC URL is working
- Ensure you have enough ETH for gas

**"Envio deployment failed"**
- Check contract address in config.yaml
- Verify the contract is deployed and verified
- Make sure start_block is correct

**"Frontend not connecting"**
- Check WalletConnect Project ID
- Verify environment variables are loaded
- Clear browser cache and try again

### Getting Help

1. **MetaMask Discord**: [Join here](https://discord.gg/metamask)
2. **Envio Discord**: [Join here](https://discord.gg/envio)
3. **Hackathon Support**: Check hackathon Discord/Telegram

## Security Notes

⚠️ **Important Security Reminders**:
- Never commit private keys to git
- Use a separate wallet for deployment
- Keep your API keys secure
- Test thoroughly on Sepolia before any mainnet deployment

## Next Steps After Deployment

1. **Create Demo Video**: Record the full user flow
2. **Submit to Hackathon**: Upload to the submission platform
3. **Share on Social**: Tweet about your progress with #MetaMaskHackathon
4. **Get Feedback**: Share with the community for testing

---

**Ready to deploy? Let's build the future of DeFi automation! 🚀**