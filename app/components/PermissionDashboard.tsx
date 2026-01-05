'use client'

import React from 'react'
import { usePermissions } from '@/providers/PermissionProvider'
import { useSessionAccount } from '@/providers/SessionAccountProvider'
import { Shield, Key, Zap, CheckCircle, Clock, DollarSign, ExternalLink, Trash2, AlertCircle } from 'lucide-react'
import { formatEther } from 'viem'
import GrantPermissions from './GrantPermissions'

export function PermissionDashboard() {
    const { permission, removePermission } = usePermissions()
    const { sessionAccount } = useSessionAccount()

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white">Advanced Permissions</h2>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1">ERC-7715 Delegated Execution Control</p>
                </div>
                <div className="px-4 py-2 bg-metamask-500/10 border border-metamask-500/20 rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-metamask-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-metamask-500 uppercase tracking-widest">MetaMask Flask Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Permission Details */}
                <div className="lg:col-span-2 space-y-6">
                    {permission ? (
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 border-b border-white/10 bg-gradient-to-br from-green-500/10 to-transparent">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center border border-green-500/20">
                                        <Shield className="w-8 h-8 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Execution Delegate Active</h3>
                                        <p className="text-green-400/60 text-xs font-bold uppercase tracking-widest">Authorized via Native-Token-Periodic</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Daily Limit</p>
                                        <p className="text-2xl font-black text-white">{permission.permission.data.periodAmount ? formatEther(BigInt(permission.permission.data.periodAmount)) : '0.01'} <span className="text-xs text-white/40">ETH</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Status</p>
                                        <div className="flex items-center gap-2 text-green-400">
                                            <CheckCircle className="w-4 h-4" />
                                            <p className="text-sm font-black uppercase tracking-tight">Active</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Expiry</p>
                                        <p className="text-sm font-black text-white/80">{new Date(permission.expiry * 1000).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                                        <Key className="w-4 h-4" />
                                        Signer Configuration
                                    </h4>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 font-mono text-xs break-all text-white/40">
                                        {permission.signer.data.address}
                                        <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-metamask-500">Authorized Session Key</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={removePermission}
                                        className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-red-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Revoke All Permissions
                                    </button>
                                    <a
                                        href={`https://sepolia.etherscan.io/address/${sessionAccount?.address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Scanner
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 border-dashed rounded-[2.5rem] p-12 text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                                <Shield className="w-10 h-10 text-white/20" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Active Permissions</h3>
                            <p className="text-white/40 text-sm max-w-sm mx-auto mb-8">
                                You haven't granted any advanced permissions yet. Grant permissions to enable 1-click swarm execution.
                            </p>
                            <div className="max-w-md mx-auto">
                                <GrantPermissions
                                    onPermissionGranted={() => { }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Security Features Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                            <Zap className="w-6 h-6 text-yellow-500 mb-4" />
                            <h4 className="font-bold text-white mb-2">Gasless Execution</h4>
                            <p className="text-xs text-white/40 leading-relaxed">Transactions are wrapped in UserOperations and sponsored via Pimlico Paymaster.</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                            <Clock className="w-6 h-6 text-blue-500 mb-4" />
                            <h4 className="font-bold text-white mb-2">Timed Expiry</h4>
                            <p className="text-xs text-white/40 leading-relaxed">Permissions automatically expire after the set duration for maximum security.</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Status */}
                <div className="space-y-6">
                    <div className="p-8 bg-gradient-to-br from-metamask-500/20 to-orange-500/20 rounded-[2.5rem] border border-metamask-500/20">
                        <h3 className="text-lg font-black text-white mb-4">Account Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-white/40 uppercase">EIP-7702</span>
                                <span className="text-[10px] font-black text-green-400 uppercase">Supported</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-white/40 uppercase">Smart Account</span>
                                <span className="text-[10px] font-black text-green-400 uppercase">Active</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-white/40 uppercase">Session Key</span>
                                <span className="text-[10px] font-black text-white uppercase">{sessionAccount ? 'Ready' : 'Pending'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                        <h3 className="text-lg font-black text-white mb-4 italic">Security Note</h3>
                        <p className="text-xs text-white/40 leading-relaxed mb-4">
                            ERC-7715 permissions are stored locally in your browser. Revoking here will remove the local record, but the on-chain delegation remains until the expiry time or manual revocation via MetaMask.
                        </p>
                        <div className="flex items-center gap-2 text-orange-400/60">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Flask Experimental</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
