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
You are the Swarm Intelligence for MetaArmy, a DeFi automation platform. Parse the following user intent into precise blockchain actions.

CRITICAL: Extract the EXACT amount mentioned by the user. Do not default to generic amounts.

User Input: "${userInput}"

Extract and return a JSON object with these fields:
- overallGoal: brief summary of the user's intent
- isBundle: boolean (true if more than 1 action is required)
- tasks: array of objects, each containing:
    - action: one of ["invest", "swap", "yield", "rebalance", "dca", "vote", "snipe"]
    - asset: cryptocurrency symbol (ETH, USDC, ARMY, etc.)
    - amount: EXACT amount from user input (e.g., "12", "0.5", "100.25") - DO NOT use default amounts
    - target: DeFi protocol (Aave, Compound, Uniswap, Lido, etc.) or "MetaArmy DAO"
    - conditions: array of smart triggers (e.g., ["gas < 30 gwei", "APY > 5%"])
    - requiresZk: boolean (true if "secure", "verified", or "zk" is mentioned)
- priority: one of ["speed", "efficiency", "cost"]
- confidence: 0-1 score

AMOUNT EXTRACTION RULES:
- "invest 12 USDC" → amount: "12"
- "Help me invest 12 USDC in DeFi" → amount: "12"
- "$50 into Aave" → amount: "50"
- "0.1 ETH to Uniswap" → amount: "0.1"
- If no amount specified, use "100" as default

PROTOCOL MAPPING:
- "DeFi", "yield", "lending" → Aave
- "swap", "trade", "exchange" → Uniswap  
- "stake", "staking" → Lido
- "compound" → Compound

Examples:
Input: "Help me invest 12 USDC in DeFi"
Output: {
  "overallGoal": "Invest 12 USDC in DeFi yield farming",
  "isBundle": false,
  "tasks": [
    { "action": "invest", "asset": "USDC", "amount": "12", "target": "Aave", "conditions": ["APY > 3%", "gas < 30 gwei"], "requiresZk": false }
  ],
  "priority": "efficiency",
  "confidence": 0.95
}

Input: "swap 0.5 ETH for USDC and stake in Aave securely"
Output: {
  "overallGoal": "Swap ETH and stake in Aave with security",
  "isBundle": true,
  "tasks": [
    { "action": "swap", "asset": "ETH", "amount": "0.5", "target": "Uniswap", "conditions": ["gas < 25 gwei"], "requiresZk": true },
    { "action": "invest", "asset": "USDC", "amount": "0.5", "target": "Aave", "conditions": ["APY > 3%"], "requiresZk": true }
  ],
  "priority": "efficiency",
  "confidence": 0.98
}

Return ONLY valid JSON without any markdown formatting.
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

// Fallback rule-based parsing if Gemini fails - Enhanced for better amount detection
function fallbackParsing(input: string): GeminiSwarmResponse {
  const normalizedInput = input.toLowerCase()
  const tasks: SwarmTaskResponse[] = []

  // Enhanced amount extraction
  const extractAmount = (text: string): string => {
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
    if (text.includes('aave')) return 'Aave'
    if (text.includes('compound')) return 'Compound'
    if (text.includes('uniswap') || text.includes('swap')) return 'Uniswap'
    if (text.includes('lido') || text.includes('staking')) return 'Lido'
    if (text.includes('defi') || text.includes('yield') || text.includes('invest')) return 'Aave'
    return 'Aave' // Default for investment
  }

  // Basic split for fallback
  const parts = input.split(/ and |, /)
  parts.forEach(part => {
    const subPart = part.toLowerCase()
    tasks.push({
      action: subPart.includes('swap') ? 'swap' : subPart.includes('snipe') ? 'snipe' : 'invest',
      asset: subPart.match(/(usdc|eth|army|dai|weth)/i)?.[0].toUpperCase() || 'USDC',
      amount: extractAmount(part),
      target: detectProtocol(subPart),
      conditions: ['Automated by MetaArmy'],
      requiresZk: subPart.includes('zk') || subPart.includes('secure')
    })
  })

  return {
    overallGoal: input,
    isBundle: tasks.length > 1,
    tasks,
    priority: 'efficiency',
    confidence: 0.7
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