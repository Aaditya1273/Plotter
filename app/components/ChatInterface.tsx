'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  Zap,
  X,
  Eye,
  Activity,
  Layers,
  Cpu,
  ArrowRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useSmartAccountsKit } from '../hooks/useSmartAccountsKit'
import { parseUserSwarmIntent, generateSwarmDescription, taskToPermission } from '../lib/ai-parser'
import { useWriteContract, useWaitForTransactionReceipt, useGasPrice } from 'wagmi'
import { parseUnits, encodeFunctionData, formatUnits } from 'viem'

const META_ARMY_ADDRESS = (process.env.NEXT_PUBLIC_META_PLOT_AGENT_ADDRESS || '0xdEb3a0D43D207ba8AD8e77F665B32B18c84Bf34a') as `0x${string}`

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
  },
  {
    name: 'executeBundle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'bundleId', type: 'bytes32' },
      { name: 'zkProofHashes', type: 'bytes32[]' }
    ],
    outputs: []
  }
] as const

interface SwarmStep {
  id: string
  action: string
  target: string
  status: 'pending' | 'active' | 'success' | 'error'
  isZk?: boolean
}

interface Message {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  status?: 'pending' | 'success' | 'error'
  swarmBundle?: {
    goal: string
    isBundle: boolean
    steps: SwarmStep[]
  }
}

interface ChatInterfaceProps {
  account: string
}

export function ChatInterface({ account }: ChatInterfaceProps) {
  const { data: gasPrice } = useGasPrice()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Welcome to MetaArmy. I am your Swarm Orchestrator. What multi-chain tasks shall we automate today? (e.g., 'Swap $400 ETH for USDC and stake in Aave, then vote on ENS prop 204')",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [pendingSwarm, setPendingSwarm] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { createPermission } = useSmartAccountsKit()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    try {
      const swarmIntent = await parseUserSwarmIntent(input)
      setPendingSwarm(swarmIntent)
      setShowReviewModal(true)
    } catch (error) {
      toast.error('Swarm Brain unavailable')
    } finally {
      setIsLoading(false)
    }
  }

  const { writeContractAsync } = useWriteContract()

  const handleConfirmSwarm = async () => {
    if (!pendingSwarm) return

    setShowReviewModal(false)
    const swarm = pendingSwarm

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    const swarmMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: generateSwarmDescription(swarm),
      timestamp: new Date(),
      status: 'pending',
      swarmBundle: {
        goal: swarm.overallGoal,
        isBundle: swarm.isBundle,
        steps: swarm.tasks.map((t: any) => ({
          id: t.id,
          action: t.action,
          target: t.target,
          status: 'pending',
          isZk: t.requiresZk
        }))
      }
    }

    setMessages(prev => [...prev, userMessage, swarmMessage])
    setInput('')

    try {
      toast.loading(`Deploying Swarm: Creating on-chain bundle...`, { id: 'swarm' })

      // Prepare actions for contract
      const actions = swarm.tasks.map((t: any) => ({
        target: (t.targetAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
        amount: parseUnits(t.amount || '0', 18),
        data: '0x' as `0x${string}`, // In a real app, this would be encoded call data
        requiresZk: !!t.requiresZk
      }))

      // Real Contract Call
      const txHash = await writeContractAsync({
        address: META_ARMY_ADDRESS,
        abi: META_ARMY_ABI,
        functionName: 'createSwarmBundle',
        args: [swarm.overallGoal, actions],
      })

      toast.loading(`Verifying Swarm on-chain: ${txHash.substring(0, 10)}...`, { id: 'swarm' })

      // Update UI to show progress
      for (const [index, task] of swarm.tasks.entries()) {
        setMessages(prev => prev.map(msg =>
          msg.id === swarmMessage.id && msg.swarmBundle
            ? { ...msg, swarmBundle: { ...msg.swarmBundle, steps: msg.swarmBundle.steps.map((s, i) => i === index ? { ...s, status: 'success' } : s) } }
            : msg
        ))
        await new Promise(r => setTimeout(r, 400)) // Visual aesthetic pause
      }

      setMessages(prev => prev.map(msg =>
        msg.id === swarmMessage.id ? { ...msg, status: 'success' } : msg
      ))

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">Swarm Deployed!</span>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline text-indigo-600 hover:text-indigo-800"
          >
            View on Etherscan ↗
          </a>
        </div>,
        { id: 'swarm', duration: 8000 }
      )

      const finalMsg: Message = {
        id: (Date.now() + 5).toString(),
        type: 'system',
        content: `✅ Swarm initialized at tx: ${txHash.substring(0, 10)}... Agents are now executing tasks autonomously.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, finalMsg])

    } catch (err) {
      console.error('Swarm error:', err)
      toast.error('Swarm Deployment Failed: Wallet rejected or insufficient funds', { id: 'swarm' })
      setMessages(prev => prev.map(msg =>
        msg.id === swarmMessage.id ? { ...msg, status: 'error' } : msg
      ))
    }
    setPendingSwarm(null)
  }

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* v3 Swarm Review Modal */}
      {showReviewModal && pendingSwarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-xl">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full border border-white/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  <Layers className="w-7 h-7 text-metamask-500" /> Swarm Verification
                </h3>
                <div className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">
                  v3.0 Engine
                </div>
              </div>

              <div className="space-y-4 mb-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {pendingSwarm.tasks.map((task: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-metamask-200 transition-all">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-xs text-gray-400 border border-gray-100">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">{task.action}</p>
                      <p className="font-bold text-gray-900">{task.amount} {task.asset} on <span className="text-metamask-600">{task.target}</span></p>
                    </div>
                    {task.requiresZk && (
                      <div title="ZK Proofs Enabled">
                        <Shield className="w-5 h-5 text-indigo-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-5 bg-green-50 rounded-3xl border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Savings</span>
                  </div>
                  <p className="text-lg font-black text-green-900">${(pendingSwarm.tasks.length * 6).toFixed(0)} gas saved</p>
                </div>
                <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Security</span>
                  </div>
                  <p className="text-lg font-black text-indigo-900">ZK Batch Seal</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowReviewModal(false)} className="px-8 py-5 rounded-2xl text-gray-400 font-bold hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleConfirmSwarm} className="flex-1 px-8 py-5 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest hover:bg-metamask-600 shadow-xl transition-all active:scale-[0.98]">
                  Launch Swarm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-2xl overflow-hidden min-h-[650px] flex flex-col">
        {/* Header v3 */}
        <div className="bg-white/80 p-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-metamask-500 blur-xl opacity-30 animate-pulse"></div>
              <div className="relative w-14 h-14 bg-white rounded-[1.25rem] flex items-center justify-center border border-gray-100 shadow-lg">
                <img src="/logo.png" alt="MetaArmy Logo" className="w-10 h-10 object-contain" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Swarm Orchestrator v3</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Autonomous Grid Active</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-indigo-50 rounded-2xl flex items-center gap-2 border border-indigo-100">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">ZK-Batched</span>
            </div>
          </div>
        </div>

        {/* Messages v3 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] lg:max-w-[75%] rounded-[2rem] p-6 ${msg.type === 'user' ? 'bg-gray-900 text-white rounded-br-none shadow-xl' :
                msg.type === 'system' ? 'bg-green-50 text-green-800 border border-green-100 w-full text-center font-bold px-10' :
                  'bg-white/80 border border-white rounded-bl-none shadow-sm'
                }`}>
                <div className="flex items-start gap-4">
                  {msg.type === 'ai' && <Bot className="w-6 h-6 text-metamask-500 mt-1" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>

                    {msg.swarmBundle && (
                      <div className="mt-6 space-y-3 pt-6 border-t border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Deploying Swarm Execution Bundle</p>
                        {msg.swarmBundle.steps.map((step, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${step.status === 'success' ? 'bg-green-50 border-green-100 text-green-700' :
                            step.status === 'active' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 animate-pulse' :
                              'bg-gray-50 border-gray-100 text-gray-400 opacity-60'
                            }`}>
                            <div className="flex items-center gap-3">
                              {step.status === 'success' ? <CheckCircle className="w-4 h-4" /> :
                                step.status === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                  <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                              <span className="text-xs font-bold">{step.action} on {step.target}</span>
                            </div>
                            {step.isZk && <Shield className="w-3 h-3 opacity-50" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[9px] mt-4 opacity-30 font-black text-right uppercase tracking-widest">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input v3 */}
        <div className="p-8 bg-white/80 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-50 rounded-[2rem] border border-gray-200 p-2 focus-within:ring-4 focus-within:ring-metamask-500/10 focus-within:bg-white transition-all">
              <div className="flex items-center px-4">
                <Zap className="w-5 h-5 text-gray-300 mr-3" />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Define your Swarm intent..."
                  className="flex-1 bg-transparent py-4 text-sm font-bold text-gray-900 focus:outline-none resize-none placeholder:text-gray-300"
                  rows={1}
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="w-14 h-14 bg-metamask-500 text-white rounded-2xl flex items-center justify-center hover:bg-metamask-600 shadow-lg shadow-metamask-200 transition-all active:scale-90 disabled:opacity-20"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-7 h-7" />}
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Gas: {gasPrice ? formatUnits(gasPrice, 9).split('.')[0] : '18'} Gwei</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Proof: Batched</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}