# 🚀 Quick Start Guide

## Get Real Contract Addresses

You're right - those were placeholder addresses! Here's how to get real ones:

### 1. Quick Setup
```bash
npm run setup
```

### 2. Get Required Keys

**WalletConnect Project ID** (2 minutes)
1. Go to https://cloud.walletconnect.com/
2. Sign up/login → Create Project → Copy Project ID

**Infura API Key** (2 minutes)  
1. Go to https://infura.io/
2. Sign up/login → Create Project → Copy Project ID

**Test Wallet** (1 minute)
1. Create new MetaMask wallet (for deployment only!)
2. Export private key
3. Get Sepolia ETH: https://sepoliafaucet.com/

### 3. Deploy Your Contract
```bash
# Install dependencies
npm install

# Edit .env.local with your keys
cp .env.example .env.local

# Compile and deploy
npm run compile
npm run deploy
```

**This will give you YOUR real contract address!**

### 4. Real Sepolia Addresses (Already Correct)

These are the actual addresses on Sepolia testnet:

```javascript
// ✅ These are REAL addresses
AAVE_POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951'
USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8'
DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357'
```

### 5. Get Test Tokens
- **Sepolia ETH**: https://sepoliafaucet.com/
- **Test USDC/DAI**: https://staging.aave.com/faucet/

### 6. Start Development
```bash
npm run dev
```

## What You'll Get

After deployment:
- ✅ Real MetaPlotAgent contract address
- ✅ Verified on Sepolia Etherscan  
- ✅ Ready for Envio indexing
- ✅ Working with real Aave protocol

## Need Help?

Run the setup script first:
```bash
npm run setup
```

It will check everything and guide you through the process!

---

**The placeholder addresses were just examples - now you'll have real, working contracts! 🎯**