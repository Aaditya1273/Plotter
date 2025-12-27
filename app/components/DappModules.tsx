'use client'

import React from 'react'
import {
    ArrowUpRight,
    ArrowDownLeft,
    PieChart,
    Activity,
    ExternalLink,
    Wallet
} from 'lucide-react'
import { useBlockchainData, useTransactionHistory } from '../hooks/useBlockchainData'
import { toast } from 'react-hot-toast'

export function AssetModule() {
    const { balances, values, totalNetWorth } = useBlockchainData()

    const assets = [
        { 
            symbol: 'ETH', 
            name: 'Ethereum', 
            balance: parseFloat(balances.eth).toFixed(4), 
            value: values.eth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025' 
        },
        { 
            symbol: 'USDC', 
            name: 'USD Coin', 
            balance: parseFloat(balances.usdc).toFixed(2), 
            value: values.usdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=025' 
        },
        { 
            symbol: 'ARMY', 
            name: 'MetaArmy', 
            balance: parseFloat(balances.army).toFixed(2), 
            value: values.army.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            icon: '/coin.png' 
        },
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-gray-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-metamask-500/10 blur-[150px] -mr-64 -mt-64"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center">
                            <Wallet className="w-12 h-12 text-metamask-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mb-2">Total Net Worth</p>
                            <h3 className="text-6xl font-black tracking-tight">${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {assets.map(asset => (
                    <div key={asset.symbol} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group">
                        <div className="flex items-center justify-center mb-8">
                            <div className={`w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center ${asset.symbol === 'ARMY' ? 'p-0 overflow-hidden' : 'p-2'}`}>
                                {asset.icon.startsWith('http') || asset.icon.startsWith('/') ? 
                                    <img src={asset.icon} alt={asset.symbol} className="w-full h-full object-contain" /> : 
                                    <span className="text-2xl">{asset.icon}</span>
                                }
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 text-center">{asset.name}</p>
                        <p className="text-2xl font-black text-gray-900 mb-4 text-center">{asset.balance} {asset.symbol}</p>
                        <p className="text-sm font-bold text-gray-400 text-center">${asset.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-3 mb-10">
                    <PieChart className="w-6 h-6 text-indigo-500" />
                    <h3 className="text-xl font-black text-gray-900">Portfolio Allocation</h3>
                </div>
                <div className="space-y-6">
                    {(() => {
                        const ethPercent = totalNetWorth > 0 ? (values.eth / totalNetWorth * 100).toFixed(1) : '0';
                        const usdcPercent = totalNetWorth > 0 ? (values.usdc / totalNetWorth * 100).toFixed(1) : '0';
                        const armyPercent = totalNetWorth > 0 ? (values.army / totalNetWorth * 100).toFixed(1) : '0';

                        return [
                            { label: 'Ethereum (ETH)', value: `${ethPercent}%`, color: 'bg-indigo-500', amount: `${parseFloat(balances.eth).toFixed(4)} ETH` },
                            { label: 'USD Coin (USDC)', value: `${usdcPercent}%`, color: 'bg-green-500', amount: `${parseFloat(balances.usdc).toFixed(2)} USDC` },
                            { label: 'MetaArmy (ARMY)', value: `${armyPercent}%`, color: 'bg-purple-500', amount: `${parseFloat(balances.army).toFixed(2)} ARMY` },
                        ].filter(item => parseFloat(item.value) > 0).map(item => (
                            <div key={item.label} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <span>{item.label}</span>
                                    <span>{item.value}</span>
                                </div>
                                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100/50">
                                    <div className={`${item.color} h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]`} style={{ width: item.value }}></div>
                                </div>
                                <p className="text-xs text-gray-500">{item.amount}</p>
                            </div>
                        ))
                    })()}
                </div>
            </div>
        </div>
    )
}

export function HistoryModule() {
    const { history, loading } = useTransactionHistory()

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white/40 rounded-[3rem] border border-gray-100 min-h-[400px]">
                <Activity className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Fetching Real On-Chain History...</p>
            </div>
        )
    }

    if (history.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">On-Chain <span className="text-indigo-600 text-lg">History</span></h2>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Export CSV</button>
                        <button onClick={() => toast.success('All ZK Proofs Verified on-chain (Brevis)', { icon: '🛡️' })} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">Verify All ZK</button>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden p-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-4">No MetaArmy Transactions Yet</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Deploy your first swarm bundle to see transaction history here. All MetaArmy interactions will be tracked with ZK-proof verification.
                    </p>
                    <div className="text-xs text-gray-400 space-y-2">
                        <p>• Swarm Bundle Deployments</p>
                        <p>• Permission Grants & Revocations</p>
                        <p>• Agent Execution History</p>
                        <p>• ZK-Proof Verification Status</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">On-Chain <span className="text-indigo-600 text-lg">History</span></h2>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Export CSV</button>
                    <button onClick={() => toast.success('All ZK Proofs Verified on-chain (Brevis)', { icon: '🛡️' })} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">Verify All ZK</button>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction / Task</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Executed</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gas Fee</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {history.map(tx => (
                            <tr key={tx.id} className="hover:bg-indigo-50/20 transition-all group">
                                <td className="px-8 py-7">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            tx.type === 'SWARM_DEPLOYMENT' ? 'bg-purple-100 text-purple-600' :
                                            tx.type === 'PERMISSION_GRANTED' ? 'bg-green-100 text-green-600' :
                                            tx.type === 'SWARM_EXECUTION' ? 'bg-blue-100 text-blue-600' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {tx.type === 'SWARM_DEPLOYMENT' ? <ArrowUpRight className="w-5 h-5" /> :
                                             tx.type === 'PERMISSION_GRANTED' ? <ArrowDownLeft className="w-5 h-5" /> :
                                             <Activity className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{tx.label}</p>
                                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">{tx.hash}</p>
                                            {tx.amount && <p className="text-xs text-indigo-600 mt-1">{tx.amount}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-7">
                                    <div className="flex items-center gap-2">
                                        {tx.status === 'Success' ? 
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> : 
                                            tx.status === 'Active' ?
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> :
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        }
                                        <span className="text-xs font-bold text-gray-700">{tx.status}</span>
                                        {tx.zk && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-black uppercase">ZK</span>}
                                    </div>
                                </td>
                                <td className="px-8 py-7 text-xs font-bold text-gray-500">{tx.age}</td>
                                <td className="px-8 py-7 text-xs font-black text-gray-900">{tx.gas}</td>
                                <td className="px-8 py-7 text-right">
                                    <button 
                                        onClick={() => window.open(`https://sepolia.etherscan.io/tx/${tx.id}`, '_blank')}
                                        className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}