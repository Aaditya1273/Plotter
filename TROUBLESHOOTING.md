# 🔧 MetaArmy Troubleshooting Guide

## Common Issues and Solutions

### 1. **"Failed transaction" Error in Marketplace**

**Symptoms:**
- Transaction fails when clicking "Execute" button
- Browser shows "Transaction 25 failed! Transaction dropped or replaced"

**Root Causes & Solutions:**

#### **A. Bundle Already Executed**
```
Error: "Bundle not active"
Solution: This bundle has already been executed. Check transaction history.
```

#### **B. Invalid Bundle ID**
```
Error: Bundle ID format issue
Solution: The system now auto-converts transaction hashes to proper bytes32 format.
```

#### **C. ZK Proof Mismatch**
```
Error: "Proof count mismatch"
Solution: Updated to generate correct number of proof hashes automatically.
```

#### **D. Insufficient Gas**
```
Error: "insufficient funds" or "out of gas"
Solution: Increased gas limit to 1,000,000. Ensure you have enough Sepolia ETH.
```

#### **E. Wrong Network**
```
Error: Network mismatch
Solution: Ensure MetaMask is connected to Sepolia testnet.
```

---

## **Quick Fixes Applied:**

### ✅ **Fixed Bundle ID Format**
- Now properly converts transaction hashes to bytes32
- Handles both hex and non-hex formats

### ✅ **Fixed ZK Proof Array**
- Automatically generates correct number of proof hashes
- Matches the number of actions in the bundle

### ✅ **Increased Gas Limit**
- Raised from 500,000 to 1,000,000 gas
- Should handle complex bundle executions

### ✅ **Better Error Handling**
- Specific error messages for different failure types
- Console logging for debugging

### ✅ **Bundle Status Checking**
- Validates bundle exists before execution
- Prevents unnecessary failed transactions

---

## **Testing Steps:**

### **1. Check Your Setup**
```bash
# Ensure you're on Sepolia testnet
Network: Sepolia (Chain ID: 11155111)
Contract: 0xcf4F105FeAc23F00489a7De060D34959f8796dd0
```

### **2. Verify Wallet Balance**
```bash
# You need Sepolia ETH for gas
Minimum: 0.01 ETH for multiple transactions
Get from: https://sepoliafaucet.com/
```

### **3. Deploy a New Swarm First**
```bash
# Go to Chat Interface
1. Type: "invest 10 USDC in DeFi"
2. Approve the swarm bundle
3. Wait for deployment confirmation
4. Then try executing in Marketplace
```

### **4. Check Browser Console**
```bash
# Open Developer Tools (F12)
1. Go to Console tab
2. Look for MetaArmy logs
3. Check for specific error messages
```

---

## **Debug Information:**

### **Contract Details:**
- **Address**: `0xcf4F105FeAc23F00489a7De060D34959f8796dd0`
- **Network**: Sepolia Testnet
- **Explorer**: https://sepolia.etherscan.io/address/0xcf4F105FeAc23F00489a7De060D34959f8796dd0

### **Expected Transaction Flow:**
1. **createSwarmBundle()** - Deploy new swarm (via Chat)
2. **executeBundle()** - Execute deployed swarm (via Marketplace)

### **Common Transaction Patterns:**
```solidity
// Successful deployment
createSwarmBundle("DeFi Yield Optimizer", actions[])
→ Returns bundleId (bytes32)
→ Emits SwarmBundleCreated event

// Successful execution  
executeBundle(bundleId, zkProofHashes[])
→ Executes all actions in bundle
→ Emits SwarmActionExecuted events
→ Sets bundle.active = false
```

---

## **Still Having Issues?**

### **1. Reset and Retry:**
```bash
1. Refresh the page
2. Reconnect MetaMask
3. Deploy a fresh swarm via Chat
4. Try executing the new swarm
```

### **2. Check Network Status:**
```bash
# Verify Sepolia is working
- Check https://sepolia.etherscan.io/
- Ensure recent blocks are being mined
- Verify your transactions appear
```

### **3. Manual Contract Interaction:**
```bash
# Use Etherscan directly
1. Go to contract on Etherscan
2. Connect wallet to "Write Contract"
3. Try executeBundle() manually
4. Compare with app behavior
```

### **4. Get Help:**
```bash
# Provide this info when asking for help:
- Your wallet address
- Transaction hash that failed
- Browser console errors
- Network (should be Sepolia)
- MetaMask version
```

---

## **Prevention Tips:**

### **✅ Best Practices:**
- Always deploy swarms via Chat first
- Wait for deployment confirmation
- Check Marketplace shows your swarm
- Ensure sufficient Sepolia ETH balance
- Use latest Chrome/Brave browser
- Keep MetaMask updated

### **⚠️ Avoid These:**
- Don't execute the same bundle twice
- Don't switch networks mid-transaction
- Don't close browser during execution
- Don't use very old transaction hashes

---

**The fixes I've applied should resolve the "Failed transaction" error. Try executing a swarm now and let me know if you still see issues!** 🚀