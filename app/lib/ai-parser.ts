// AI Intent Parser v3.0 - The Swarm Engine
import { parseIntentWithGemini } from './gemini-ai'

export interface SwarmTask {
  id: string
  action: 'invest' | 'swap' | 'yield' | 'rebalance' | 'snipe' | 'vote' | 'post' | 'dca'
  asset: string
  target: string
  amount: string
  conditions: string[]
  requiresZk: boolean
}

export interface ParsedSwarmIntent {
  overallGoal: string
  isBundle: boolean
  tasks: SwarmTask[]
  priority: 'speed' | 'efficiency' | 'cost'
}

// v3 Parser supports multi-task bundles and sub-agent delegation
export async function parseUserSwarmIntent(input: string): Promise<ParsedSwarmIntent> {
  const normalizedInput = input.toLowerCase()

  // Try Gemini 3.0 Logic first
  if (process.env.GEMINI_API_KEY || (typeof window !== 'undefined' && localStorage.getItem('GEMINI_API_KEY'))) {
    try {
      const geminiResult = await parseIntentWithGemini(input)
      if (geminiResult && geminiResult.tasks.length > 0) {
        return {
          overallGoal: geminiResult.overallGoal || input,
          isBundle: geminiResult.isBundle,
          tasks: geminiResult.tasks.map((t, i) => ({
            id: (i + 1).toString(),
            action: t.action,
            asset: t.asset,
            target: t.target,
            amount: t.amount || '400',
            conditions: t.conditions,
            requiresZk: t.requiresZk
          })),
          priority: geminiResult.priority || 'efficiency'
        }
      }
    } catch (error) {
      console.warn('AI Brain v3 fallback to rule-based swarm parsing')
    }
  }

  // Rule-Based Swarm Parsing (v3 Fallback) - Enhanced Amount Detection
  const tasks: SwarmTask[] = []

  // Enhanced amount extraction - look for numbers with or without currency symbols
  const extractAmount = (text: string): string => {
    // Look for patterns like "12 USDC", "$12", "12.5", "invest 12"
    const patterns = [
      /(\d+(?:\.\d+)?)\s*(?:usdc|eth|dai|dollars?|usd)/i,  // "12 USDC", "12.5 ETH"
      /\$(\d+(?:\.\d+)?)/,                                   // "$12", "$12.5"
      /invest\s+(\d+(?:\.\d+)?)/i,                          // "invest 12"
      /(\d+(?:\.\d+)?)\s*(?:in|into|on)/i,                 // "12 in DeFi"
      /(\d+(?:\.\d+)?)/                                     // Any number as fallback
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1]
      }
    }
    return '100' // Default fallback
  }

  // Enhanced protocol detection
  const detectProtocol = (text: string): string => {
    const protocols = {
      'aave': 'Aave',
      'compound': 'Compound', 
      'uniswap': 'Uniswap',
      'lido': 'Lido',
      'yearn': 'Yearn',
      'curve': 'Curve',
      'defi': 'Aave', // Default DeFi to Aave
      'yield': 'Aave',
      'lending': 'Aave',
      'liquidity': 'Uniswap',
      'swap': 'Uniswap',
      'staking': 'Lido'
    }
    
    for (const [keyword, protocol] of Object.entries(protocols)) {
      if (text.toLowerCase().includes(keyword)) {
        return protocol
      }
    }
    return 'Aave' // Default to Aave for investment
  }

  // Enhanced asset detection
  const detectAsset = (text: string): string => {
    const assets = ['USDC', 'ETH', 'DAI', 'WETH', 'USDT']
    for (const asset of assets) {
      if (text.toLowerCase().includes(asset.toLowerCase())) {
        return asset
      }
    }
    return 'USDC' // Default
  }

  // Basic split by 'and' or ',' to simulate multi-tasking
  const parts = input.split(/ and |, /)
  parts.forEach((part, index) => {
    const subPart = part.toLowerCase()
    let action: SwarmTask['action'] = 'invest'
    
    // Enhanced action detection
    if (subPart.includes('swap') || subPart.includes('exchange')) action = 'swap'
    else if (subPart.includes('snipe') || subPart.includes('buy')) action = 'snipe'
    else if (subPart.includes('vote') || subPart.includes('govern')) action = 'vote'
    else if (subPart.includes('post') || subPart.includes('social')) action = 'post'
    else if (subPart.includes('yield') || subPart.includes('farm')) action = 'yield'
    else if (subPart.includes('dca') || subPart.includes('average')) action = 'dca'

    tasks.push({
      id: (index + 1).toString(),
      action,
      asset: detectAsset(part),
      target: detectProtocol(part),
      amount: extractAmount(part),
      conditions: ['Automated by MetaArmy'],
      requiresZk: subPart.includes('zk') || subPart.includes('secure') || subPart.includes('private')
    })
  })

  return {
    overallGoal: input,
    isBundle: tasks.length > 1,
    tasks,
    priority: 'efficiency'
  }
}

// Original helper for backward compatibility
export function generateSwarmDescription(intent: ParsedSwarmIntent): string {
  if (intent.tasks.length === 1) {
    const t = intent.tasks[0]
    return `Initializing sub-agent for ${t.action} ${t.amount} ${t.asset} on ${t.target}.`
  }
  return `Launching Swarm of ${intent.tasks.length} sub-agents: ${intent.tasks.map(t => t.action).join(' + ')}.`
}

// Convert SwarmTask to Legacy Permission (for current v2 contracts)
export function taskToPermission(task: SwarmTask) {
  return {
    target: task.target,
    amount: task.amount,
    expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
    conditions: task.conditions,
    frequency: 'one-time',
    requiresZk: task.requiresZk
  }
}