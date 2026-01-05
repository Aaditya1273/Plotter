'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  Shield,
  Zap,
  CheckCircle,
  X,
  Store,
  Grid,
  Layers,
  Cpu,
  Flame,
  ArrowUpRight,
  MousePointer2,
  Activity,
  Loader2
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TaskComposer } from './TaskComposer'
import { SwarmMarketplace } from './SwarmMarketplace'
import { useBlockchainData, useTransactionHistory } from '../hooks/useBlockchainData'
import { useWriteContract } from 'wagmi'
import { toast } from 'react-hot-toast'

const META_ARMY_ADDRESS = (process.env.NEXT_PUBLIC_META_PLOT_AGENT_ADDRESS || '0xcf4F105FeAc23F00489a7De060D34959f8796dd0') as `0x${string}`

const META_ARMY_ABI = [
  {
    name: 'createSwarmBundle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'goal', type: 'string' },
      {
        name: 'actions',
        type: 'tuple[]',
        components: [
          { name: 'target', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'requiresZk', type: 'bool' }
        ]
      }
    ],
    outputs: [{ name: '', type: 'bytes32' }]
  }
] as const

interface DashboardProps {
  account: string
}

export function Dashboard({ account }: DashboardProps) {
  const { totalNetWorth, balances } = useBlockchainData()
  const { history } = useTransactionHistory()
  const { writeContractAsync } = useWriteContract()
  const [activeView, setActiveView] = useState<'overview' | 'marketplace' | 'pilothub'>('overview')
  const [permissions, setPermissions] = useState<any[]>([])

  const portfolioData = [
    { date: '21', value: totalNetWorth * 0.92 },
    { date: '22', value: totalNetWorth * 0.95 },
    { date: '23', value: totalNetWorth * 0.94 },
    { date: '24', value: totalNetWorth * 0.98 },
    { date: '25', value: totalNetWorth * 0.97 },
    { date: '26', value: totalNetWorth },
  ]

  const metrics = {
    gasSaved: `$${(parseFloat(balances.eth) * 120 + 40).toFixed(2)}`,
    apyBoost: '8.4%',
    swarmHealth: 'Optimal (98%)'
  }

  const handleTogglePermission = (id: string) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p))
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* View Logic */}
      <div className="flex p-2 bg-gray-100/50 backdrop-blur-xl rounded-[1.5rem] w-fit border border-gray-200 shadow-inner">
        {[
          { id: 'overview', label: 'Overview', icon: Grid },
          { id: 'pilothub', label: 'PilotHub', icon: Cpu },
          { id: 'marketplace', label: 'Marketplace', icon: Store }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeView === tab.id
              ? 'bg-gray-900 text-white shadow-xl scale-[1.05]'
              : 'text-gray-400 hover:text-gray-900'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeView === 'pilothub' ? (
        <TaskComposer />
      ) : activeView === 'overview' ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Total Gas Saved', val: metrics.gasSaved, icon: Zap, color: 'text-orange-500' },
              { label: 'Swarm APY Boost', val: metrics.apyBoost, icon: TrendingUp, color: 'text-indigo-500' },
              { label: 'Grid Integrity', val: '99.9%', icon: Shield, color: 'text-green-500' }
            ].map(m => (
              <div key={m.label} className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm hover:shadow-2xl transition-all group">
                <div className="flex justify-between items-center mb-8">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{m.label}</p>
                  <m.icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <p className="text-4xl font-black text-gray-900 leading-none">{m.val}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-metamask-500/10 blur-[120px] -mr-64 -mt-64 group-hover:bg-metamask-500/20 transition-all duration-1000"></div>
            <div className="flex justify-between items-end mb-12">
              <div>
                <h3 className="text-3xl font-black tracking-tight mb-2">Yield Alpha <span className="text-metamask-500">Live</span></h3>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Real-time Swarm Indexing</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-green-400">${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-2">Live Net Worth</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioData}>
                  <defs>
                    <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f6851b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f6851b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100"><p className="text-xs font-black text-gray-900">${payload[0].value}</p></div>
                    }
                    return null
                  }} />
                  <Area type="monotone" dataKey="value" stroke="#f6851b" strokeWidth={6} fill="url(#curveColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black mb-10 flex items-center gap-3"><Shield className="w-6 h-6 text-indigo-600" /> Active Mission Units</h3>
              <div className="space-y-6">
                {permissions.length > 0 ? permissions.map(p => (
                  <div key={p.id} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:border-metamask-300 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-black text-gray-900 mb-1">{p.target}</h4>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{p.amount} • {p.frequency}</p>
                      </div>
                      {p.zkVerified && <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">ZK Secure</div>}
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => handleTogglePermission(p.id)} className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                        {p.status === 'active' ? 'Stand Down' : 'Resume Mission'}
                      </button>
                      <button className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center p-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                    <Shield className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Active Mission Units</p>
                    <p className="text-gray-300 text-[9px] mt-2">Deploy agents via Swarm Chat to begin</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <Layers className="w-6 h-6 text-gray-400" /> 
                  Swarm Feed
                </h3>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-600 transition-all"
                >
                  Refresh
                </button>
              </div>
              <div className="space-y-4">
                {history.length > 0 ? history.slice(0, 4).map((tx, i) => (
                  <div 
                    key={i} 
                    onClick={() => window.open(`https://sepolia.etherscan.io/tx/${tx.fullHash || tx.id}`, '_blank')}
                    className="flex items-center gap-5 p-5 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 cursor-pointer group"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${
                      tx.type === 'SWARM_DEPLOYMENT' ? 'bg-purple-50 text-purple-600' :
                      tx.type === 'PERMISSION_GRANTED' ? 'bg-green-50 text-green-600' :
                      tx.type === 'SWARM_EXECUTION' ? 'bg-blue-50 text-blue-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {tx.type === 'SWARM_DEPLOYMENT' ? <Cpu className="w-6 h-6" /> :
                       tx.type === 'PERMISSION_GRANTED' ? <CheckCircle className="w-6 h-6" /> :
                       <Activity className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold truncate text-gray-900">{tx.label}</p>
                        <span className="text-[10px] font-black text-gray-400">{new Date(tx.age).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{tx.hash}</p>
                        <span className="text-[9px] text-gray-400">• {tx.gas}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.zk && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-black uppercase">ZK Verified</span>}
                        <span className="text-[8px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-black uppercase">{tx.status}</span>
                        {tx.amount && <span className="text-[8px] text-gray-500">{tx.amount}</span>}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">No MetaArmy Activity Yet</p>
                    <p className="text-xs text-gray-500">Deploy a swarm to see transaction history</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeView === 'marketplace' ? (
        <SwarmMarketplace />
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-4">PilotHub</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Advanced agent configuration and deployment tools coming soon.
          </p>
        </div>
      )}
    </div>
  )
}
// Meta-Pilot Dashboard v3.0 Final Polish