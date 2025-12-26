// Gemini AI integration for MetaArmy intent parsing
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface SwarmTaskResponse {
  action: 'invest' | 'swap' | 'yield' | 'rebalance' | 'dca' | 'vote' | 'snipe'
  asset: string
  amount?: string
  target: string
  conditions: string[]
  requiresZk: boolean
}

export interface GeminiSwarmResponse {
  overallGoal: string
  isBundle: boolean
  tasks: SwarmTaskResponse[]
  priority: 'speed' | 'efficiency' | 'cost'
  confidence: number
}

export async function parseIntentWithGemini(userInput: string): Promise<GeminiSwarmResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
You are the Swarm Intelligence for MetaArmy. Parse the following user intent into a sequence of blockchain actions (Swarm Bundle).

User Input: "${userInput}"

Extract and return a JSON object with these fields:
- overallGoal: brief summary of the user's intent
- isBundle: boolean (true if more than 1 action is required)
- tasks: array of objects, each containing:
    - action: one of ["invest", "swap", "yield", "rebalance", "dca", "vote", "snipe"]
    - asset: cryptocurrency symbol (ETH, USDC, ARMY, etc.)
    - amount: amount (e.g., "0.5", "400", "all")
    - target: DeFi protocol (Aave, Uniswap, Lido, etc.) or "MetaArmy DAO"
    - conditions: array of triggers (e.g., ["gas < 30 gwei", "APY > 5%"])
    - requiresZk: boolean (true if "secure", "verified", or "zk" is mentioned)
- priority: one of ["speed", "efficiency", "cost"]
- confidence: 0-1 score

Example:
Input: "swap $400 eth for usdc and stake in aave securely"
Output: {
  "overallGoal": "Swap and Stake Swarm",
  "isBundle": true,
  "tasks": [
    { "action": "swap", "asset": "ETH", "amount": "400", "target": "Uniswap", "conditions": ["gas < 25 gwei"], "requiresZk": true },
    { "action": "invest", "asset": "USDC", "amount": "400", "target": "Aave", "conditions": ["APY > 3%"], "requiresZk": true }
  ],
  "priority": "efficiency",
  "confidence": 0.98
}

Return ONLY valid JSON.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanedText)

    // Validate and set defaults
    return {
      overallGoal: parsed.overallGoal || userInput,
      isBundle: parsed.isBundle || parsed.tasks?.length > 1,
      tasks: parsed.tasks?.length > 0 ? parsed.tasks : [
        {
          action: parsed.action || 'invest',
          asset: parsed.asset || 'USDC',
          amount: parsed.amount || '400',
          target: parsed.target || 'Aave',
          conditions: parsed.conditions || ['gas < 30 gwei'],
          requiresZk: parsed.requiresZk || false
        }
      ],
      priority: parsed.priority || 'efficiency',
      confidence: parsed.confidence || 0.8
    }

  } catch (error) {
    console.error('Gemini AI parsing error:', error)

    // Fallback to rule-based parsing
    return fallbackParsing(userInput)
  }
}

// Fallback rule-based parsing if Gemini fails
function fallbackParsing(input: string): GeminiSwarmResponse {
  const normalizedInput = input.toLowerCase()
  const tasks: SwarmTaskResponse[] = []

  // Basic split for fallback
  const parts = input.split(/ and |, /)
  parts.forEach(part => {
    const subPart = part.toLowerCase()
    tasks.push({
      action: subPart.includes('swap') ? 'swap' : subPart.includes('snipe') ? 'snipe' : 'invest',
      asset: subPart.match(/(usdc|eth|army)/i)?.[0].toUpperCase() || 'USDC',
      amount: subPart.match(/\$?(\d+)/)?.[1] || '100',
      target: subPart.includes('aave') ? 'Aave' : 'Uniswap',
      conditions: ['Automated Fallback'],
      requiresZk: subPart.includes('zk') || subPart.includes('secure')
    })
  })

  return {
    overallGoal: input,
    isBundle: tasks.length > 1,
    tasks,
    priority: 'efficiency',
    confidence: 0.5
  }
}

// Generate human-readable summary of parsed intent
export function generateIntentSummary(intent: GeminiSwarmResponse): string {
  if (intent.tasks.length === 1) {
    const t = intent.tasks[0]
    return `AI identified: ${t.action} ${t.amount} ${t.asset} on ${t.target}${t.requiresZk ? ' (ZK-Secured)' : ''}.`
  }
  return `AI initialized Swarm for: ${intent.tasks.map(t => t.action).join(' then ')} across ${Array.from(new Set(intent.tasks.map(t => t.target))).join(', ')}.`
}

// Validate Gemini API key
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
}

// Get Gemini API setup instructions
export function getGeminiSetupInstructions(): string {
  return `
To enable AI-powered intent parsing:
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add it to your .env.local file:
   GEMINI_API_KEY=your_actual_api_key_here
4. Restart your development server
`
}