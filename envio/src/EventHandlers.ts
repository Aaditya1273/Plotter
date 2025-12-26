import {
  MetaPlotAgent,
  AavePool,
  Permission,
  AgentExecution,
  UserActivity,
  PortfolioSnapshot,
} from "generated";

// MetaPlotAgent Event Handlers

MetaPlotAgent.PermissionGranted.handler(async ({ event, context }) => {
  const { permissionId, user, target, amount, expiry } = event.params;
  
  const permission: Permission = {
    id: permissionId,
    permissionId: permissionId,
    user: user.toLowerCase(),
    target: target.toLowerCase(),
    amount: amount,
    expiry: expiry,
    active: true,
    totalExecuted: 0n,
    conditions: [], // Will be populated from contract call if needed
    created: event.block.timestamp,
    createdTx: event.transaction.hash,
    revokedAt: undefined,
    revokedTx: undefined,
  };

  context.Permission.set(permission);

  // Create user activity
  const activity: UserActivity = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    user: user.toLowerCase(),
    type: "PERMISSION_GRANTED",
    description: `Granted permission for ${target} with limit ${amount}`,
    amount: amount,
    asset: "USDC", // Could be dynamic based on target
    protocol: getProtocolName(target),
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    success: true,
  };

  context.UserActivity.set(activity);
});

MetaPlotAgent.PermissionRevoked.handler(async ({ event, context }) => {
  const { permissionId, user } = event.params;
  
  // Update existing permission
  const existingPermission = await context.Permission.get(permissionId);
  if (existingPermission) {
    const updatedPermission: Permission = {
      ...existingPermission,
      active: false,
      revokedAt: event.block.timestamp,
      revokedTx: event.transaction.hash,
    };
    
    context.Permission.set(updatedPermission);
  }

  // Create user activity
  const activity: UserActivity = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    user: user.toLowerCase(),
    type: "PERMISSION_REVOKED",
    description: `Revoked permission ${permissionId}`,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    success: true,
  };

  context.UserActivity.set(activity);
});

MetaPlotAgent.AgentExecuted.handler(async ({ event, context }) => {
  const { permissionId, target, amount, success, reason } = event.params;
  
  // Create execution record
  const execution: AgentExecution = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    permission: permissionId,
    target: target.toLowerCase(),
    amount: amount,
    timestamp: event.block.timestamp,
    success: success,
    reason: reason,
    txHash: event.transaction.hash,
    gasUsed: event.transaction.gasUsed || 0n,
    gasPrice: event.transaction.gasPrice || 0n,
    blockNumber: event.block.number,
  };

  context.AgentExecution.set(execution);

  // Update permission total executed if successful
  if (success) {
    const existingPermission = await context.Permission.get(permissionId);
    if (existingPermission) {
      const updatedPermission: Permission = {
        ...existingPermission,
        totalExecuted: existingPermission.totalExecuted + amount,
      };
      
      context.Permission.set(updatedPermission);
    }
  }

  // Create user activity
  const permission = await context.Permission.get(permissionId);
  if (permission) {
    const activity: UserActivity = {
      id: `${event.transaction.hash}-${event.logIndex}-activity`,
      user: permission.user,
      type: success ? "INVESTMENT" : "INVESTMENT",
      description: success 
        ? `Agent invested ${amount} in ${getProtocolName(target)}: ${reason}`
        : `Agent execution failed: ${reason}`,
      amount: amount,
      asset: "USDC",
      protocol: getProtocolName(target),
      timestamp: event.block.timestamp,
      txHash: event.transaction.hash,
      blockNumber: event.block.number,
      success: success,
    };

    context.UserActivity.set(activity);
  }
});

// Aave Pool Event Handlers

AavePool.Supply.handler(async ({ event, context }) => {
  const { reserve, user, onBehalfOf, amount } = event.params;
  
  // Create user activity for Aave supply
  const activity: UserActivity = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    user: user.toLowerCase(),
    type: "INVESTMENT",
    description: `Supplied ${amount} to Aave pool`,
    amount: amount,
    asset: getAssetSymbol(reserve),
    protocol: "Aave",
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    success: true,
  };

  context.UserActivity.set(activity);

  // Update portfolio snapshot (simplified)
  await updatePortfolioSnapshot(user.toLowerCase(), event.block.timestamp, event.block.number, context);
});

AavePool.Withdraw.handler(async ({ event, context }) => {
  const { reserve, user, to, amount } = event.params;
  
  // Create user activity for Aave withdrawal
  const activity: UserActivity = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    user: user.toLowerCase(),
    type: "WITHDRAWAL",
    description: `Withdrew ${amount} from Aave pool`,
    amount: amount,
    asset: getAssetSymbol(reserve),
    protocol: "Aave",
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    success: true,
  };

  context.UserActivity.set(activity);

  // Update portfolio snapshot
  await updatePortfolioSnapshot(user.toLowerCase(), event.block.timestamp, event.block.number, context);
});

// Helper Functions

function getProtocolName(address: string): string {
  const protocols: { [key: string]: string } = {
    "0x6ae43d3271ff6888e7fc43fd7321a503ff738951": "Aave",
    // Add more protocol addresses as needed
  };
  
  return protocols[address.toLowerCase()] || "Unknown";
}

function getAssetSymbol(address: string): string {
  const assets: { [key: string]: string } = {
    "0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8": "USDC",
    "0x0000000000000000000000000000000000000000": "ETH",
    // Add more asset addresses as needed
  };
  
  return assets[address.toLowerCase()] || "UNKNOWN";
}

async function updatePortfolioSnapshot(
  user: string, 
  timestamp: bigint, 
  blockNumber: bigint, 
  context: any
) {
  // Simplified portfolio calculation
  // In production, this would aggregate all user positions
  const snapshotId = `${user}-${blockNumber}`;
  
  const snapshot: PortfolioSnapshot = {
    id: snapshotId,
    user: user,
    totalValue: 1000n, // Placeholder - would calculate actual value
    yieldEarned: 18n, // Placeholder - would calculate actual yield
    timestamp: timestamp,
    blockNumber: blockNumber,
  };

  context.PortfolioSnapshot.set(snapshot);
}