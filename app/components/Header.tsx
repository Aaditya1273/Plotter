'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Bot, BarChart3, Zap } from 'lucide-react'

interface HeaderProps {
  isConnected: boolean
  account?: string
  activeTab: 'chat' | 'dashboard'
  setActiveTab: (tab: 'chat' | 'dashboard') => void
}

export function Header({ isConnected, activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-metamask-500 to-metamask-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Meta-Pilot AI</h1>
            </div>

            {isConnected && (
              <nav className="hidden md:flex items-center space-x-1 ml-8">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'chat'
                      ? 'bg-metamask-100 text-metamask-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>AI Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'dashboard'
                      ? 'bg-metamask-100 text-metamask-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
              </nav>
            )}
          </div>

          <ConnectButton />
        </div>

        {isConnected && (
          <nav className="md:hidden flex items-center space-x-1 mt-4">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${activeTab === 'chat'
                  ? 'bg-metamask-100 text-metamask-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${activeTab === 'dashboard'
                  ? 'bg-metamask-100 text-metamask-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}