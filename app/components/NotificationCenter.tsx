'use client'

import React, { useState, useEffect } from 'react'
import {
    Bell,
    CheckCircle,
    AlertTriangle,
    Info,
    Zap,
    Bot,
    Gavel,
    TrendingUp,
    Shield,
    X,
    ExternalLink,
    Clock,
    Settings,
    Trash2
} from 'lucide-react'
import { useTransactionHistory } from '../hooks/useBlockchainData'
import { useAccount } from 'wagmi'

interface Notification {
    id: string
    type: 'success' | 'warning' | 'info' | 'error' | 'swarm' | 'governance' | 'security'
    title: string
    message: string
    timestamp: number
    read: boolean
    action?: {
        label: string
        onClick: () => void
    }
    metadata?: {
        txHash?: string
        swarmId?: string
        proposalId?: string
    }
}

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const { history } = useTransactionHistory()
    const { address } = useAccount()

    // Generate notifications based on transaction history and system events
    useEffect(() => {
        const generateNotifications = () => {
            const newNotifications: Notification[] = []

            // Transaction-based notifications
            history.slice(0, 3).forEach((tx, index) => {
                newNotifications.push({
                    id: `tx-${tx.id}-${index}`,
                    type: tx.status === 'Success' ? 'success' : 'error',
                    title: tx.status === 'Success' ? 'Transaction Confirmed' : 'Transaction Failed',
                    message: `${tx.label} • ${tx.gas}`,
                    timestamp: Date.now() - (index * 300000), // Stagger timestamps
                    read: false,
                    action: {
                        label: 'View on Etherscan',
                        onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.fullHash || tx.id}`, '_blank')
                    },
                    metadata: {
                        txHash: tx.fullHash || tx.id
                    }
                })
            })

            // System notifications
            newNotifications.push(
                {
                    id: 'welcome',
                    type: 'info',
                    title: 'Welcome to MetaArmy 3.0',
                    message: 'Your decentralized agent army is ready for deployment',
                    timestamp: Date.now() - 600000,
                    read: false
                },
                {
                    id: 'security-update',
                    type: 'security',
                    title: 'ZK-Proof System Active',
                    message: 'All swarm executions are now secured with zero-knowledge proofs',
                    timestamp: Date.now() - 900000,
                    read: false
                },
                {
                    id: 'governance-reminder',
                    type: 'governance',
                    title: 'New Governance Proposal',
                    message: 'Upgrade MetaArmy Protocol to v4.0 with Enhanced ZK-Proof Integration',
                    timestamp: Date.now() - 1200000,
                    read: false,
                    action: {
                        label: 'Vote Now',
                        onClick: () => console.log('Navigate to governance')
                    }
                },
                {
                    id: 'swarm-ready',
                    type: 'swarm',
                    title: 'Swarm Deployment Ready',
                    message: 'Your DeFi yield optimizer is configured and ready for deployment',
                    timestamp: Date.now() - 1800000,
                    read: true
                }
            )

            setNotifications(newNotifications)
        }

        generateNotifications()
    }, []) // Remove history dependency to prevent loops

    const unreadCount = notifications.filter(n => !n.read).length

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: true } : n
        ))
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success': return CheckCircle
            case 'warning': return AlertTriangle
            case 'error': return AlertTriangle
            case 'swarm': return Bot
            case 'governance': return Gavel
            case 'security': return Shield
            default: return Info
        }
    }

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-green-600 bg-green-50'
            case 'warning': return 'text-yellow-600 bg-yellow-50'
            case 'error': return 'text-red-600 bg-red-50'
            case 'swarm': return 'text-purple-600 bg-purple-50'
            case 'governance': return 'text-indigo-600 bg-indigo-50'
            case 'security': return 'text-blue-600 bg-blue-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now()
        const diff = now - timestamp
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        return `${days}d ago`
    }

    return (
        <>
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-12 h-12 bg-white rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
            >
                <Bell className="w-5 h-5 text-gray-500" />
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </div>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="absolute top-16 right-0 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[150] overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-gray-900">Notifications</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        
                        {unreadCount > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">{unreadCount} unread notifications</span>
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                                >
                                    Mark all as read
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            <div className="p-2">
                                {notifications.map((notification) => {
                                    const Icon = getNotificationIcon(notification.type)
                                    return (
                                        <div
                                            key={notification.id}
                                            className={`p-4 rounded-2xl mb-2 transition-all cursor-pointer group ${
                                                notification.read 
                                                    ? 'bg-gray-50 hover:bg-gray-100' 
                                                    : 'bg-blue-50 hover:bg-blue-100 border-2 border-blue-200'
                                            }`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getNotificationColor(notification.type)}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-bold text-gray-900 text-sm truncate">{notification.title}</h4>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                deleteNotification(notification.id)
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-all"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    
                                                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{formatTimestamp(notification.timestamp)}</span>
                                                        </div>
                                                        
                                                        {notification.action && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    notification.action!.onClick()
                                                                }}
                                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                                                            >
                                                                {notification.action.label}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No notifications</h3>
                                <p className="text-gray-500">You're all caught up!</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            <Settings className="w-4 h-4" />
                            Notification Settings
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}