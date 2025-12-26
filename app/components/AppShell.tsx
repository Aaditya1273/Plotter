'use client'

import React from 'react'
import {
    Bot,
    LayoutDashboard,
    Wallet,
    History,
    Gavel,
    Settings,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Bell,
    Search,
    Activity
} from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import { useBlockchainData } from '../hooks/useBlockchainData'

interface SidebarProps {
    activeTab: string
    setActiveTab: (tab: any) => void
    isCollapsed: boolean
    setIsCollapsed: (c: boolean) => void
}

const menuItems = [
    { id: 'chat', label: 'Swarm Chat', icon: Bot, color: 'text-metamask-500' },
    { id: 'dashboard', label: 'ArmyHub Overview', icon: LayoutDashboard, color: 'text-indigo-500' },
    { id: 'assets', label: 'Portfolio Assets', icon: Wallet, color: 'text-green-500' },
    { id: 'history', label: 'TX History', icon: History, color: 'text-orange-500' },
    { id: 'governance', label: 'DAO Portal', icon: Gavel, color: 'text-purple-500' },
    { id: 'security', label: 'ZK Security', icon: ShieldCheck, color: 'text-blue-500' },
    { id: 'settings', label: 'Army Config', icon: Settings, color: 'text-gray-500' },
]

export function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }: SidebarProps) {
    const { disconnect } = useDisconnect()

    return (
        <aside className={`fixed left-0 top-0 h-screen bg-gray-900 text-white transition-all duration-300 z-[100] flex flex-col ${isCollapsed ? 'w-24' : 'w-72'}`}>
            {/* Brand */}
            <div className="p-8 flex items-center gap-4 mb-4">
                <img src="/logo1.png" alt="MetaArmy Logo" className="w-10 h-10 object-contain shrink-0 shadow-lg shadow-metamask-500/10" />
                {!isCollapsed && <h1 className="text-xl font-black tracking-tight text-white">MetaArmy <span className="text-metamask-500">3.0</span></h1>}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-3xl transition-all group ${activeTab === item.id
                            ? 'bg-white text-gray-900 shadow-xl'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <item.icon className={`w-6 h-6 shrink-0 ${activeTab === item.id ? item.color : 'group-hover:text-white transition-colors'}`} />
                        {!isCollapsed && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
                        {activeTab === item.id && !isCollapsed && <div className="ml-auto w-1.5 h-1.5 bg-metamask-500 rounded-full shadow-lg shadow-metamask-500/50"></div>}
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 space-y-2 mb-4">
                <button
                    onClick={() => disconnect()}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-3xl text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20"
                >
                    <LogOut className="w-6 h-6 shrink-0" />
                    {!isCollapsed && <span className="font-bold text-sm">Disconnect</span>}
                </button>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all"
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronLeft className="w-5 h-5 text-gray-400" />}
                </button>
            </div>
        </aside>
    )
}

export function AppHeader({ account, isCollapsed }: { account: string; isCollapsed: boolean }) {
    const { totalNetWorth } = useBlockchainData()
    return (
        <header className={`fixed top-0 right-0 h-24 bg-white/60 backdrop-blur-xl border-b border-gray-100 z-[90] transition-all duration-300 flex items-center px-10 ${isCollapsed ? 'left-24' : 'left-72'}`}>
            <div className="flex-1 max-w-2xl">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-metamask-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search agents, assets, or DAO proposals..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-metamask-500/5 focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">ZK Secure</span>
                </div>

                <button className="relative w-12 h-12 bg-white rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all">
                    <Bell className="w-5 h-5 text-gray-500" />
                </button>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Portfolio Value</p>
                        <p className="text-sm font-black text-gray-900 leading-none">${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </header>
    )
}
