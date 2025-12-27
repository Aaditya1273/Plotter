'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
    Search,
    Bot,
    Wallet,
    History,
    Gavel,
    TrendingUp,
    Zap,
    Shield,
    X,
    ArrowRight
} from 'lucide-react'
import { useAccount } from 'wagmi'
import { useBlockchainData, useTransactionHistory } from '../hooks/useBlockchainData'

interface SearchResult {
    id: string
    type: 'swarm' | 'transaction' | 'proposal' | 'asset' | 'agent' | 'command'
    title: string
    description: string
    icon: React.ComponentType<any>
    color: string
    action: () => void
    metadata?: string
}

interface SearchSystemProps {
    onNavigate?: (tab: string) => void
}

export function SearchSystem({ onNavigate }: SearchSystemProps) {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [results, setResults] = useState<SearchResult[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const { balances } = useBlockchainData()
    const { history } = useTransactionHistory()

    // Memoize searchable data to prevent infinite re-renders
    const searchableData = useMemo(() => [
        // Commands
        { id: 'cmd-deploy', type: 'command' as const, title: 'Deploy New Swarm', description: 'Create and deploy a new swarm bundle', icon: Bot, color: 'text-purple-600', action: () => onNavigate?.('chat') },
        { id: 'cmd-portfolio', type: 'command' as const, title: 'View Portfolio', description: 'Check your asset balances and portfolio value', icon: Wallet, color: 'text-green-600', action: () => onNavigate?.('assets') },
        { id: 'cmd-history', type: 'command' as const, title: 'Transaction History', description: 'View your recent MetaArmy transactions', icon: History, color: 'text-orange-600', action: () => onNavigate?.('history') },
        { id: 'cmd-governance', type: 'command' as const, title: 'Governance Portal', description: 'Vote on DAO proposals and governance', icon: Gavel, color: 'text-purple-600', action: () => onNavigate?.('governance') },
        { id: 'cmd-settings', type: 'command' as const, title: 'Army Configuration', description: 'Configure risk settings and preferences', icon: Shield, color: 'text-blue-600', action: () => onNavigate?.('settings') },
        
        // Assets
        { id: 'asset-eth', type: 'asset' as const, title: 'ETH Balance', description: `${balances.eth} ETH`, icon: TrendingUp, color: 'text-blue-600', action: () => onNavigate?.('assets'), metadata: 'Ethereum' },
        { id: 'asset-usdc', type: 'asset' as const, title: 'USDC Balance', description: `${balances.usdc} USDC`, icon: TrendingUp, color: 'text-green-600', action: () => onNavigate?.('assets'), metadata: 'USD Coin' },
        { id: 'asset-army', type: 'asset' as const, title: 'ARMY Tokens', description: `${balances.army} ARMY`, icon: Bot, color: 'text-purple-600', action: () => onNavigate?.('assets'), metadata: 'MetaArmy Token' },
        
        // Recent transactions (limit to prevent excessive re-renders)
        ...history.slice(0, 3).map((tx, i) => ({
            id: `tx-${tx.id || i}`,
            type: 'transaction' as const,
            title: tx.label,
            description: `${tx.status} • ${tx.age}`,
            icon: History,
            color: 'text-orange-600',
            action: () => window.open(`https://sepolia.etherscan.io/tx/${tx.fullHash || tx.id}`, '_blank'),
            metadata: tx.hash
        })),

        // Agents/Swarms
        { id: 'agent-defi', type: 'agent' as const, title: 'DeFi Yield Optimizer', description: 'Automated yield farming and optimization', icon: Zap, color: 'text-yellow-600', action: () => onNavigate?.('chat') },
        { id: 'agent-nft', type: 'agent' as const, title: 'NFT Sniper Bot', description: 'Automated NFT trading and sniping', icon: Bot, color: 'text-pink-600', action: () => onNavigate?.('chat') },
        { id: 'agent-gov', type: 'agent' as const, title: 'Governance Auto-Voter', description: 'Automated DAO voting based on preferences', icon: Gavel, color: 'text-indigo-600', action: () => onNavigate?.('chat') },
        
        // Proposals (sample)
        { id: 'prop-upgrade', type: 'proposal' as const, title: 'Upgrade MetaArmy Protocol to v4.0', description: 'Enhanced ZK-Proof Integration • 89% FOR', icon: Gavel, color: 'text-purple-600', action: () => onNavigate?.('governance') },
        { id: 'prop-gas', type: 'proposal' as const, title: 'Increase Gas Limit for Swarms', description: 'Proposal to increase default gas limits • Active', icon: Zap, color: 'text-orange-600', action: () => onNavigate?.('governance') },
    ], [balances.eth, balances.usdc, balances.army, history.slice(0, 3).length]) // Simplified dependencies

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const filtered = searchableData.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()) ||
            item.type.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8)

        setResults(filtered)
        setSelectedIndex(0)
    }, [query, searchableData]) // Now using memoized searchableData

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setIsOpen(true)
                inputRef.current?.focus()
            }
            
            if (!isOpen) return

            switch (e.key) {
                case 'Escape':
                    setIsOpen(false)
                    setQuery('')
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex(prev => Math.max(prev - 1, 0))
                    break
                case 'Enter':
                    e.preventDefault()
                    if (results[selectedIndex]) {
                        results[selectedIndex].action()
                        setIsOpen(false)
                        setQuery('')
                    }
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, results, selectedIndex])

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'command': return 'bg-blue-50 text-blue-600'
            case 'asset': return 'bg-green-50 text-green-600'
            case 'transaction': return 'bg-orange-50 text-orange-600'
            case 'proposal': return 'bg-purple-50 text-purple-600'
            case 'agent': return 'bg-pink-50 text-pink-600'
            case 'swarm': return 'bg-indigo-50 text-indigo-600'
            default: return 'bg-gray-50 text-gray-600'
        }
    }

    return (
        <>
            {/* Search Input */}
            <div className="relative group flex-1 max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-metamask-500 transition-colors" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search agents, assets, or DAO proposals... (⌘K)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-metamask-500/5 focus:bg-white transition-all outline-none"
                />
            </div>

            {/* Search Results Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200]" onClick={() => setIsOpen(false)}>
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 w-full max-w-2xl mx-auto">
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                            {/* Search Header */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search anything in MetaArmy..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 text-base font-medium focus:ring-4 focus:ring-metamask-500/5 focus:bg-white transition-all outline-none"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="max-h-96 overflow-y-auto">
                                {results.length > 0 ? (
                                    <div className="p-2">
                                        {results.map((result, index) => (
                                            <button
                                                key={result.id || index}
                                                onClick={() => {
                                                    result.action()
                                                    setIsOpen(false)
                                                    setQuery('')
                                                }}
                                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                                                    index === selectedIndex 
                                                        ? 'bg-metamask-50 border-2 border-metamask-200' 
                                                        : 'hover:bg-gray-50 border-2 border-transparent'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(result.type)}`}>
                                                    <result.icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-gray-900 truncate">{result.title}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getTypeColor(result.type)}`}>
                                                            {result.type}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">{result.description}</p>
                                                    {result.metadata && (
                                                        <p className="text-xs text-gray-400 mt-1">{result.metadata}</p>
                                                    )}
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                            </button>
                                        ))}
                                    </div>
                                ) : query.trim() ? (
                                    <div className="p-8 text-center">
                                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">No results found</h3>
                                        <p className="text-gray-500">Try searching for swarms, assets, transactions, or commands</p>
                                    </div>
                                ) : (
                                    <div className="p-6">
                                        <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {searchableData.filter(item => item.type === 'command').slice(0, 4).map((item, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        item.action()
                                                        setIsOpen(false)
                                                    }}
                                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(item.type)}`}>
                                                        <item.icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{item.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-4">
                                        <span>↑↓ Navigate</span>
                                        <span>↵ Select</span>
                                        <span>ESC Close</span>
                                    </div>
                                    <span>⌘K to search</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}