# 🌐 Remix IDE Deployment Guide

## Step-by-Step Remix Deployment

### 1. Prepare MetaMask
- Switch to Sepolia testnet
- Get Sepolia ETH from https://sepoliafaucet.com/
- Ensure you have at least 0.01 ETH for deployment

### 2. Open Remix IDE
Go to https://remix.ethereum.org/

### 3. Create Contract File
1. In file explorer, create new file: `MetaPlotAgent.sol`
2. Copy this contract code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MetaPlotAgent {
    
    struct Permission {
        address user;
        address target;
        uint256 amount;
        uint256 expiry;
        bool active;
        uint256 totalExecuted;
    }
    
    mapping(bytes32 => Permission) public permissions;
    mapping(address => bytes32[]) public userPermissions;
    
    event PermissionGranted(
        bytes32 indexed permissionId,
        address indexed user,
        address indexed target,
        uint256 amount,
        uint256 expiry
    );
    
    event PermissionRevoked(
        bytes32 indexed permissionId,
        address indexed user
    );
    
    event AgentExecuted(
        bytes32 indexed permissionId,
        address indexed target,
        uint256 amount,
        bool success,
        string reason
    );
    
    function grantPermission(
        address target,
        uint256 amount,
        uint256 expiry
    ) external returns (bytes32) {
        bytes32 permissionId = keccak256(
            abi.encodePacked(msg.sender, target, amount, block.timestamp)
        );
        
        permissions[permissionId] = Permission({
            user: msg.sender,
            target: target,
            amount: amount,
            expiry: expiry,
            active: true,
            totalExecuted: 0
        });
        
        userPermissions[msg.sender].push(permissionId);
        
        emit PermissionGranted(permissionId, msg.sender, target, amount, expiry);
        return permissionId;
    }
    
    function revokePermission(bytes32 permissionId) external {
        require(permissions[permissionId].user == msg.sender, "Not permission owner");
        permissions[permissionId].active = false;
        emit PermissionRevoked(permissionId, msg.sender);
    }
    
    function executeWithPermission(
        bytes32 permissionId,
        address target,
        uint256 amount,
        string memory reason
    ) external {
        Permission storage perm = permissions[permissionId];
        
        require(perm.active, "Permission not active");
        require(perm.expiry > block.timestamp, "Permission expired");
        require(target == perm.target, "Invalid target");
        require(amount <= perm.amount, "Amount exceeds limit");
        
        perm.totalExecuted += amount;
        
        emit AgentExecuted(permissionId, target, amount, true, reason);
    }
    
    function getUserPermissions(address user) external view returns (bytes32[] memory) {
        return userPermissions[user];
    }
    
    function getPermission(bytes32 permissionId) external view returns (Permission memory) {
        return permissions[permissionId];
    }
}
```

### 4. Compile Contract
1. Go to "Solidity Compiler" tab (📄 icon)
2. Select compiler version: `0.8.19+`
3. Click "Compile MetaPlotAgent.sol"
4. Check for green checkmark ✅

### 5. Deploy to Sepolia
1. Go to "Deploy & Run Transactions" tab (🚀 icon)
2. Environment: Select "Injected Provider - MetaMask"
3. Confirm MetaMask is connected to Sepolia
4. Contract: Select "MetaPlotAgent"
5. Click "Deploy" button
6. Confirm transaction in MetaMask popup
7. Wait for confirmation (~15 seconds)

### 6. Verify Deployment
1. Copy contract address from Remix console
2. Go to https://sepolia.etherscan.io/
3. Search for your contract address
4. Verify it shows up with your transaction

### 7. Update Your Frontend
Edit your `.env.local` file:
```env
NEXT_PUBLIC_META_PLOT_AGENT_ADDRESS=0xYourActualContractAddressHere
NEXT_PUBLIC_DEPLOYMENT_BLOCK=5400000
```

### 8. Test Contract Functions
In Remix, you can test the deployed contract:
1. Expand your deployed contract in the "Deployed Contracts" section
2. Try calling `grantPermission` with test parameters:
   - target: `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951` (Aave Pool)
   - amount: `1000000` (1 USDC in wei)
   - expiry: `1735689600` (Future timestamp)

## Troubleshooting

**"Gas estimation failed"**
- Make sure you have enough Sepolia ETH
- Try increasing gas limit manually

**"MetaMask not connecting"**
- Refresh Remix page
- Reconnect MetaMask
- Check you're on Sepolia network

**"Compilation failed"**
- Check Solidity version is 0.8.19+
- Verify contract code is copied correctly

## Next Steps After Deployment

1. **Update Envio Config**: Add your contract address to `envio/config.yaml`
2. **Start Frontend**: Run `npm run dev`
3. **Test Integration**: Connect wallet and try the chat interface
4. **Create Demo Video**: Record the full user flow

## Contract Verification (Optional)

To verify on Etherscan:
1. Go to your contract on https://sepolia.etherscan.io/
2. Click "Contract" tab → "Verify and Publish"
3. Select "Solidity (Single file)"
4. Paste your contract code
5. Set compiler version to 0.8.19
6. Submit for verification

---

**Remix is great for quick deployment, but Hardhat gives you a more professional workflow for the hackathon! 🏆**