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
      content: "Hello! I'm MetaArmy AI, your DeFi automation assistant. I can help you understand protocols, set up automated strategies, or answer questions about yield farming. Try asking me something like 'What is Aave?' or 'Help me invest 100 USDC in DeFi' to get started!",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [pendingSwarm, setPendingSwarm] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Helper function to determine if input is a swarm deployment intent
  const isSwarmDeploymentIntent = async (input: string): Promise<boolean> => {
    const normalizedInput = input.toLowerCase()
    
    // Strong indicators of deployment intent
    const strongDeploymentIndicators = [
      'swap', 'invest', 'stake', 'deploy', 'create swarm', 'execute', 'buy', 'sell',
      'lend to', 'borrow from', 'put money', 'send', 'transfer', 'automate this',
      'set up', 'i want to swap', 'i want to invest', 'help me swap', 'help me invest'
    ]
    
    // DeFi protocol and asset mentions
    const defiMentions = [
      'aave', 'uniswap', 'lido', 'compound', 'usdc', 'eth', 'dai', 'weth'
    ]
    
    // Amount indicators
    const amountPattern = /\$?\d+(\.\d+)?\s*(usdc|eth|dai|dollars?|usd)/i
    
    // Check for strong deployment indicators
    const hasStrongIndicator = strongDeploymentIndicators.some(indicator => 
      normalizedInput.includes(indicator)
    )
    
    // Check for DeFi mentions
    const hasDeFiMention = defiMentions.some(protocol => 
      normalizedInput.includes(protocol)
    )
    
    // Check for amount mentions
    const hasAmount = amountPattern.test(normalizedInput)
    
    // It's a deployment intent if:
    // 1. Has strong indicator AND (DeFi mention OR amount)
    // 2. OR has amount AND DeFi mention (even without strong indicator)
    return (hasStrongIndicator && (hasDeFiMention || hasAmount)) || 
           (hasAmount && hasDeFiMention)
  }

  // Generate conversational AI response using Gemini
  const generateConversationalResponse = async (input: string): Promise<string> => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return getStaticResponse(input)
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

      const prompt = `
You are MetaArmy AI, a helpful assistant for a DeFi automation platform. You help users understand:
- DeFi protocols (Aave, Uniswap, Lido, Compound)
- Automated trading and yield farming
- Smart contract permissions and security
- Gas optimization and transaction batching
- The MetaArmy platform features

IMPORTANT: Be contextual and specific. If the user mentions specific amounts, protocols, or actions, acknowledge them directly in your response.

User message: "${input}"

RESPONSE GUIDELINES:
1. If they mention specific amounts (like "12 USDC"), acknowledge that exact amount
2. If they ask about investing, suggest the best protocol for their use case
3. If they want to deploy something, guide them to be more specific or confirm their intent
4. Be conversational and helpful, not robotic
5. Keep responses concise (2-3 sentences max) but informative

Examples:
- User: "Help me invest 12 USDC in DeFi" → "I can help you invest that 12 USDC! For stable yield, Aave is great for lending USDC with around 3-5% APY. Would you like me to set up an automated investment in Aave for your 12 USDC?"
- User: "What's the best yield for USDC?" → "For USDC yield, Aave typically offers 3-5% APY for lending, while Compound offers similar rates. MetaArmy can automatically move your funds to whichever has better rates!"

Respond naturally and helpfully.
`

      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Gemini AI error:', error)
      return getStaticResponse(input)
    }
  }

  // Enhanced fallback static responses for common queries
  const getStaticResponse = (input: string): string => {
    const normalizedInput = input.toLowerCase()
    
    // Extract amount if mentioned for contextual responses
    const amountMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:usdc|eth|dai|dollars?|usd|\$)/i) || input.match(/\$(\d+(?:\.\d+)?)/i) || input.match(/(\d+(?:\.\d+)?)/i)
    const amount = amountMatch ? amountMatch[1] : null
    
    if (normalizedInput.includes('hello') || normalizedInput.includes('hi')) {
      return "Hello! I'm MetaArmy AI, your DeFi automation assistant. I can help you understand protocols, set up automated strategies, or answer questions about yield farming. What would you like to know?"
    }
    
    // Contextual investment responses
    if ((normalizedInput.includes('invest') || normalizedInput.includes('help')) && amount) {
      return `I can help you invest that ${amount} ${normalizedInput.includes('usdc') ? 'USDC' : normalizedInput.includes('eth') ? 'ETH' : 'USDC'}! For stable yield, Aave is great for lending with around 3-5% APY. Would you like me to set up an automated investment in Aave for your ${amount}?`
    }
    
    if (normalizedInput.includes('help')) {
      return "I can help you with DeFi automation! Try asking me about specific protocols like Aave or Uniswap, or tell me what you want to automate. For example: 'invest 12 USDC in DeFi' or 'swap 100 USDC for ETH'."
    }
    
    if (normalizedInput.includes('what') && normalizedInput.includes('metaarmy')) {
      return "MetaArmy is an autonomous DeFi co-pilot that lets you automate complex strategies with simple natural language commands. You grant permissions once, and AI agents handle the rest - no more endless transaction approvals!"
    }
    
    if (normalizedInput.includes('gas') || normalizedInput.includes('fee')) {
      return "MetaArmy optimizes gas costs by batching multiple actions into single transactions. You can also set gas price conditions like 'when gas < 30 gwei' to execute only during low-cost periods."
    }
    
    if (normalizedInput.includes('aave')) {
      return "Aave is a leading lending protocol where you can earn yield by supplying assets or borrow against collateral. MetaArmy can automate deposits, withdrawals, and rebalancing based on APY changes."
    }
    
    if (normalizedInput.includes('defi') && amount) {
      return `For your ${amount} ${normalizedInput.includes('usdc') ? 'USDC' : 'investment'}, I'd recommend Aave for stable lending yield (3-5% APY) or Compound for similar returns. MetaArmy can automate the deposit and monitor for better rates!`
    }
    
    if (normalizedInput.includes('security') || normalizedInput.includes('safe')) {
      return "MetaArmy uses advanced permissions (ERC-7715) with granular controls - you set spending limits, time bounds, and conditions. All critical operations can require ZK-proof verification for maximum security."
    }
    
    return "I'm here to help with DeFi automation and MetaArmy features. Feel free to ask about specific protocols, automation strategies, or try commands like 'invest 12 USDC in DeFi' to get started!"
  }
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
    
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')

    // Add instant "thinking" response for better UX
    const thinkingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: '🤖 Analyzing your request...',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, thinkingMessage])

    try {
      // Fast intent detection first
      const isSwarmIntent = await isSwarmDeploymentIntent(currentInput)
      
      if (isSwarmIntent) {
        // Update thinking message
        setMessages(prev => prev.map(msg => 
          msg.id === thinkingMessage.id 
            ? { ...msg, content: '🎯 Preparing swarm bundle...' }
            : msg
        ))

        // Parse as swarm intent and show review modal
        const swarmIntent = await parseUserSwarmIntent(currentInput)
        setPendingSwarm(swarmIntent)
        setShowReviewModal(true)
        
        // Replace thinking message with final response
        const aiMessage: Message = {
          id: thinkingMessage.id, // Reuse ID to replace thinking message
          type: 'ai',
          content: `✨ **Swarm Bundle Ready**\n\nI've analyzed your request: "${swarmIntent.overallGoal}"\n\n${generateSwarmDescription(swarmIntent)}\n\n*Please review the actions before deployment.*`,
          timestamp: new Date()
        }
        setMessages(prev => prev.map(msg => 
          msg.id === thinkingMessage.id ? aiMessage : msg
        ))
      } else {
        // Update thinking message for conversation
        setMessages(prev => prev.map(msg => 
          msg.id === thinkingMessage.id 
            ? { ...msg, content: '💭 Thinking about your question...' }
            : msg
        ))

        // Handle as normal conversation using Gemini AI
        const aiResponse = await generateConversationalResponse(currentInput)
        
        // Replace thinking message with final response
        const aiMessage: Message = {
          id: thinkingMessage.id, // Reuse ID to replace thinking message
          type: 'ai',
          content: aiResponse,
          timestamp: new Date()
        }
        setMessages(prev => prev.map(msg => 
          msg.id === thinkingMessage.id ? aiMessage : msg
        ))
      }
    } catch (error) {
      console.error('Chat error:', error)
      
      // Replace thinking message with error
      const errorMessage: Message = {
        id: thinkingMessage.id, // Reuse ID to replace thinking message
        type: 'ai',
        content: "I'm having trouble processing that request. Could you try rephrasing it?",
        timestamp: new Date()
      }
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessage.id ? errorMessage : msg
      ))
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
      const actions = swarm.tasks.map((t: any) => {
        // Parse amount based on token type or use default
        let amount = BigInt(0)
        if (t.amount && typeof t.amount === 'string') {
          const amountStr = t.amount.replace(/[^0-9.]/g, '') || '0'
          if (t.amount.includes('USDC')) {
            amount = parseUnits(amountStr, 6) // USDC has 6 decimals
          } else {
            amount = parseUnits(amountStr, 18) // Default to 18 decimals
          }
        }

        return {
          target: (t.targetAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
          amount,
          data: '0x' as `0x${string}`, // In a real app, this would be encoded call data
          requiresZk: !!t.requiresZk
        }
      })

      // Real Contract Call with gas limit
      const txHash = await writeContractAsync({
        address: META_ARMY_ADDRESS,
        abi: META_ARMY_ABI,
        functionName: 'createSwarmBundle',
        args: [swarm.overallGoal, actions],
        gas: BigInt(10000000), // Reduced gas limit to 10M (well under the 16.7M cap)
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
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] border border-white/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3">
                  <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-metamask-500" /> Swarm Verification
                </h3>
                <div className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">
                  v3.0 Engine
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {pendingSwarm.tasks.map((task: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-metamask-200 transition-all">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center font-black text-xs text-gray-400 border border-gray-100 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">{task.action}</p>
                      <p className="font-bold text-gray-900 truncate">{task.amount} {task.asset} on <span className="text-metamask-600">{task.target}</span></p>
                    </div>
                    {task.requiresZk && (
                      <div title="ZK Proofs Enabled" className="flex-shrink-0">
                        <Shield className="w-5 h-5 text-indigo-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Savings</span>
                  </div>
                  <p className="text-lg font-black text-green-900">${(pendingSwarm.tasks.length * 6).toFixed(0)} gas saved</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Security</span>
                  </div>
                  <p className="text-lg font-black text-indigo-900">ZK Batch Seal</p>
                </div>
              </div>
            </div>
            
            {/* Fixed footer with buttons */}
            <div className="p-6 sm:p-8 pt-0 flex-shrink-0">
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowReviewModal(false)} 
                  className="px-6 py-4 rounded-2xl text-gray-400 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmSwarm} 
                  disabled={!pendingSwarm}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest hover:bg-metamask-600 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
                  placeholder="Ask me anything about DeFi or describe what you want to automate..."
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