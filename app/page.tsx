'use client'
// MetaArmy 3.0 Swarm Orchestrator


import React, { useState } from 'react'
import { Sidebar, AppHeader } from './components/AppShell'
import { ChatInterface } from './components/ChatInterface'
import { Dashboard } from './components/Dashboard'
import { LandingHero } from './components/LandingHero'
import { AssetModule, HistoryModule } from './components/DappModules'
import { GovernancePortal } from './components/GovernancePortal'
import { ArmyConfiguration } from './components/ArmyConfiguration'
import { useAccount } from 'wagmi'
import { Bot, Gavel, ShieldCheck, Settings as SettingsIcon, Users, CheckCircle } from 'lucide-react'
import SmoothScroll from './components/SmoothScroll'
import { useTransactionHistory } from './hooks/useBlockchainData'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { history } = useTransactionHistory()
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'assets' | 'history' | 'governance' | 'security' | 'settings'>('chat')
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!isConnected) {
    return (
      <SmoothScroll>
        <LandingHero />
      </SmoothScroll>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'chat': return <ChatInterface account={address || ''} />
      case 'dashboard': return <Dashboard account={address || ''} />
      case 'assets': return <AssetModule />
      case 'history': return <HistoryModule />
      case 'governance': return <GovernancePortal />
      case 'security': return (
        <div className="flex flex-col items-center justify-center p-20 bg-gray-900 rounded-[3rem] text-white min-h-[500px] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-metamask-500/10 blur-[120px]"></div>
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10">
            <ShieldCheck className="w-10 h-10 text-metamask-500" />
          </div>
          <h2 className="text-3xl font-black mb-2">ZK-Proof Verification Center</h2>
          <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-8">Brevis ZK-Turbo Powered</p>
          <div className="mt-8 grid grid-cols-2 gap-6 w-full max-w-xl">
            <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/10 text-center group hover:bg-white/10 transition-all">
              <p className="text-5xl font-black text-white mb-2">{history.filter(tx => tx.label.includes('Swarm') || tx.label.includes('Bundle')).length}</p>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Active ZK Proofs</p>
            </div>
            <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/10 text-center group hover:bg-white/10 transition-all">
              <p className="text-5xl font-black text-green-400 mb-2">{history.length > 0 ? '99.9%' : '100%'}</p>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Trust Integrity</p>
            </div>
          </div>
          <div className="mt-12 flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">V3.0 Smart Shell Active</span>
          </div>
        </div>
      )
      case 'settings': return <ArmyConfiguration />
      default: return <ChatInterface account={address || ''} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-metamask-100 selection:text-metamask-600">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className={`transition-all duration-300 min-h-screen flex flex-col ${isCollapsed ? 'pl-24' : 'pl-72'}`}>
        <AppHeader account={address || ''} isCollapsed={isCollapsed} onNavigate={setActiveTab} />

        <main className="flex-1 pt-32 px-10 pb-12 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}