'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  Bot,
  Shield,
  Zap,
  Cpu,
  Layers,
  TrendingUp,
  ChevronRight,
  Globe,
  ArrowRight,
  Activity,
  MousePointer2,
  Users,
  Terminal,
  PlayCircle
} from 'lucide-react'
import BlurText from './BlurText'

// Asset Paths from generation
const ASSETS = {
  BRAIN: '/assets/brain_4k.png',
  VAULT: '/assets/vault_4k.png',
  SWARM: '/assets/swarm_4k.png'
}

export function LandingHero() {
  return (
    <div className="bg-gray-50 overflow-x-hidden">
      {/* Sticky Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[200] px-6 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-3 glass px-5 py-3 rounded-2xl border-white/40 shadow-xl shadow-black/5">
            <img src="/logo.png" alt="MetaArmy Logo" className="w-8 h-8 object-contain" />
            <span className="text-sm font-black tracking-tight">MetaArmy <span className="text-metamask-500">3.0</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 glass px-8 py-3 rounded-2xl border-white/40 shadow-xl shadow-black/5">
            {['Swarm', 'Security', 'FAQ', 'Docs'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors">{item}</a>
            ))}
          </div>

          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="glass px-6 py-3 rounded-2xl border-white/40 shadow-xl shadow-black/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-900 hover:text-white transition-all active:scale-95"
              >
                Launch App
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 px-4">
        <div className="absolute top-0 inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-metamask-500/5 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[150px] rounded-full"></div>
        </div>

        <div className="mb-12 animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="px-5 py-2 glass rounded-full flex items-center gap-3 shadow-2xl shadow-metamask-100/20 border-white/50">
            <div className="w-2 h-2 bg-metamask-500 rounded-full animate-ping"></div>
            <span className="text-[9px] font-black text-gray-900 uppercase tracking-[0.4em]">v3.0 The Verifiable Swarm is Live</span>
          </div>
        </div>

        <div className="text-center max-w-5xl mx-auto space-y-10 mb-16 relative">
          <BlurText
            text="Command the Swarm Economy"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-7xl md:text-[9.5rem] font-black text-gray-900 tracking-tight leading-[0.85] select-none justify-center"
          />
          <BlurText
            text="The first AI-Agentic Swarm for Web3. Deploy 1,000 sub-agents to execute your complex DeFi intents with ZK-Turbo security."
            delay={50}
            animateBy="words"
            direction="bottom"
            className="text-xl md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed justify-center"
          />
        </div>

        <div className="flex flex-col items-center gap-10">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="group relative px-12 py-7 bg-gray-900 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.2em] hover:bg-metamask-600 transition-all hover:scale-105 shadow-2xl shadow-gray-400/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <span className="relative flex items-center gap-4">Initialize Swarm <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" /></span>
              </button>
            )}
          </ConnectButton.Custom>

          <div className="flex items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            <span className="text-xs font-black uppercase tracking-[0.3em]">Audited by Zellic</span>
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-xs font-black uppercase tracking-[0.3em]">Built for MetaMask v3</span>
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-xs font-black uppercase tracking-[0.3em]">ZK Powered</span>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-32 w-full max-w-7xl px-4 perspective-1000">
          <div className="relative transform rotate-x-6 hover:rotate-x-0 transition-transform duration-1000 ease-out shadow-[-50px_100px_100px_-50px_rgba(0,0,0,0.1),50px_100px_100px_-50px_rgba(0,0,0,0.1)] rounded-[4rem] overflow-hidden">
            <img src={ASSETS.SWARM} alt="Swarm Visualization" className="w-full h-[600px] object-cover scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
            <div className="absolute bottom-20 left-20 right-20 flex justify-between items-end">
              <div className="space-y-4">
                <p className="text-[10px] text-metamask-400 font-black uppercase tracking-[0.3em]">Live Swarm Data</p>
                <h2 className="text-4xl font-black text-white">42,901 Active Sub-Agents</h2>
              </div>
              <div className="p-8 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20">
                <div className="flex items-center gap-4 mb-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-black text-white uppercase">$14.2M BATCHED TX VOL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-20 hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900">Scroll</span>
          <div className="w-px h-12 bg-gray-900"></div>
        </div>
      </section>

      {/* Feature Walkthrough */}
      <section id="swarm" className="py-40 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-10">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center shadow-xl">
              <Cpu className="w-10 h-10 text-metamask-500" />
            </div>
            <BlurText
              text="The Swarm Orchestrator"
              delay={100}
              animateBy="words"
              direction="top"
              className="text-6xl font-black text-gray-900 tracking-tight leading-none"
            />
            <p className="text-xl text-gray-500 font-medium leading-relaxed">
              MetaArmy 3.0 doesn't just automate; it orchestrates. Our "Swarm Engine" breaks your high-level intent into hundreds of secure sub-tasks, executing them across chains simultaneously to capture every millisecond of alpha.
            </p>
            <ul className="space-y-6">
              {[
                { icon: Zap, text: 'Massive Gas Batching (-92% fees)' },
                { icon: Globe, text: 'Cross-Chain Liquidity Routing' },
                { icon: Users, text: 'Community-Owned Agent Logic' }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-lg font-bold text-gray-800">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-metamask-500/20 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
            <img src={ASSETS.BRAIN} alt="Swarm Brain" className="relative w-full rounded-[4rem] shadow-2xl animate-float" />
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-40 bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-metamask-500/5 blur-[150px]"></div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="order-2 lg:order-1 relative group">
            <div className="absolute inset-0 bg-green-500/10 blur-[100px] rounded-full"></div>
            <img src={ASSETS.VAULT} alt="ZK Vault" className="relative w-full rounded-[4rem] shadow-2xl border border-white/10" />
          </div>
          <div className="order-1 lg:order-2 space-y-10">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10">
              <Shield className="w-5 h-5 text-metamask-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">ZK-Turbo Architecture</span>
            </div>
            <BlurText
              text="Mathematically Verifiable Wealth"
              delay={100}
              animateBy="words"
              direction="top"
              className="text-6xl font-black text-white tracking-tight leading-none"
            />
            <p className="text-xl text-white/40 font-medium leading-relaxed">
              Every swarm execution is bundled with a Brevis ZK-proof. No trust required. Your agents can only execute exactly what you've permitted, verified on-chain at every step.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                <p className="text-4xl font-black text-white mb-2">99.9%</p>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Trust Integrity</p>
              </div>
              <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                <p className="text-4xl font-black text-white mb-2">0</p>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Exploits Since Launch</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-60 px-4 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[150px] -z-10"></div>
        <h2 className="text-8xl font-black text-gray-900 mb-12 tracking-tighter">Your Army Awaits.</h2>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="px-20 py-10 bg-gray-900 text-white rounded-[3rem] font-black text-2xl uppercase tracking-[0.3em] hover:bg-metamask-600 transition-all hover:scale-110 shadow-3xl shadow-metamask-200"
            >
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>
        <div className="mt-20 flex justify-center gap-12 opacity-30 grayscale items-center">
          {['UNISWAP', 'AAVE', 'LIDO', 'ENVIO', 'BREVIS', 'METAMASK'].map(n => (
            <span key={n} className="text-sm font-black uppercase tracking-[0.5em]">{n}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="MetaArmy Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-black">MetaArmy <span className="text-metamask-500">3.0</span></span>
          </div>
          <div className="flex gap-10 text-xs font-black text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-gray-900 transition-colors">Documentation</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Governance</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Twitter (X)</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Discord</a>
          </div>
          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">© 2025 Meta-Pilot Labs. Built for The Swarm.</p>
        </div>
      </footer>
    </div>
  )
}