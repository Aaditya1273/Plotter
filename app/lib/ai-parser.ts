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

  // Rule-Based Swarm Parsing (v3 Fallback)
  const tasks: SwarmTask[] = []

  // Basic split by 'and' or ',' to simulate multi-tasking
  const parts = input.split(/ and |, /)
  parts.forEach((part, index) => {
    const subPart = part.toLowerCase()
    let action: SwarmTask['action'] = 'invest'
    if (subPart.includes('swap')) action = 'swap'
    else if (subPart.includes('snipe')) action = 'snipe'
    else if (subPart.includes('vote')) action = 'vote'
    else if (subPart.includes('post')) action = 'post'

    tasks.push({
      id: (index + 1).toString(),
      action,
      asset: subPart.match(/(usdc|eth|dai|mpa)/i)?.[0].toUpperCase() || 'USDC',
      target: subPart.includes('aave') ? 'Aave' : subPart.includes('uniswap') ? 'Uniswap' : subPart.includes('lido') ? 'Lido' : 'Unknown Protocol',
      amount: subPart.match(/\$(\d+)/)?.[1] || '100',
      conditions: ['Automated by MetaArmy'],
      requiresZk: subPart.includes('zk') || subPart.includes('secure')
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