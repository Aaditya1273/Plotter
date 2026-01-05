'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { erc7715ProviderActions } from '@metamask/smart-accounts-kit/actions'
import { parseEther, parseUnits } from 'viem'
import { CONTRACTS } from '../lib/constants'
import { useSessionAccount } from '../providers/SessionAccountProvider'
import { usePermissions } from '../providers/PermissionProvider'

/**
 * Real Smart Accounts Kit integration for ERC-7715.
 * Provides hooks for creating and managing Advanced Permissions.
 */
export function useSmartAccountsKit() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { sessionAccount, createSessionAccount } = useSessionAccount()
  const { savePermission, permission, removePermission } = usePermissions()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (isConnected && walletClient && sessionAccount) {
      setIsReady(true)
    }
  }, [isConnected, walletClient, sessionAccount])

  const createPermission = async (params: {
    amount: string
    expiryDays?: number
    justification?: string
  }) => {
    if (!walletClient || !sessionAccount) {
      throw new Error('Wallet not connected or session account missing')
    }

    const extendedClient = walletClient.extend(erc7715ProviderActions())

    const currentTime = Math.floor(Date.now() / 1000)
    const expiry = currentTime + (24 * 60 * 60 * (params.expiryDays || 30))

    console.log('Requesting execution permissions for session account:', sessionAccount.address)

    const grantedPermissions = await extendedClient.requestExecutionPermissions([{
      chainId: walletClient.chain.id,
      expiry,
      signer: {
        type: 'account',
        data: {
          address: sessionAccount.address,
        },
      },
      permission: {
        type: 'erc20-token-periodic',
        data: {
          tokenAddress: CONTRACTS.USDC,
          periodAmount: parseUnits(params.amount, 6),
          periodDuration: 86400, // 1 day
          startTime: Math.floor(Date.now() / 1000),
          justification: params.justification || 'Permission for automated USDC swarm execution',
        },
      },
      isAdjustmentAllowed: true,
    }])

    if (grantedPermissions && grantedPermissions.length > 0) {
      savePermission(grantedPermissions[0])
      return grantedPermissions[0]
    }

    throw new Error('No permissions granted')
  }

  const revoke = async () => {
    removePermission()
  }

  return {
    isReady,
    createPermission,
    revokePermission: revoke,
    permission,
    address
  }
}
