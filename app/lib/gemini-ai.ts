import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface GeminiResponse {
  intent: 'invest' | 'transfer' | 'swap' | 'yield' | 'chat' | 'portfolio' | 'help';
  confidence: number;
  amount?: string;
  token?: string;
  target?: string;
  reasoning: string;
  response: string;
}

export async function analyzeUserIntent(message: string): Promise<GeminiResponse> {
  // Check if API key is available
  if (!genAI || !apiKey) {
    console.warn("[Gemini] API key not configured, using fallback analysis");
    return fallbackAnalysis(message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are MetaArmy AI, a DeFi automation assistant. Analyze this user message and determine their intent.

User message: "${message}"

Respond with a JSON object containing:
{
  "intent": "invest|transfer|swap|yield|chat|portfolio|help",
  "confidence": 0.0-1.0,
  "amount": "extracted amount if any",
  "token": "ETH|USDC|DAI if mentioned",
  "target": "wallet address if mentioned",
  "reasoning": "brief explanation of your analysis",
  "response": "friendly response to the user"
}

Rules:
- "invest", "put", "deposit", "stake" → intent: "invest"
- "send", "transfer", "move" → intent: "transfer"  
- "swap", "exchange", "trade" → intent: "swap"
- "yield", "earn", "farm" → intent: "yield"
- "portfolio", "balance", "holdings" → intent: "portfolio"
- "help", "what can you do" → intent: "help"
- Casual greetings like "hi", "hello" → intent: "chat"
- Extract amounts like "0.01 ETH", "5 USDC", "10 dollars"
- Extract wallet addresses (0x...)
- Be confident (0.8+) for clear financial commands
- Be less confident (0.3-0.7) for ambiguous messages
- Use "chat" for casual conversation

Example responses:
- "invest 0.01 ETH" → {"intent": "invest", "confidence": 0.9, "amount": "0.01", "token": "ETH", ...}
- "hi" → {"intent": "chat", "confidence": 0.9, "response": "Hello! I'm your MetaArmy AI assistant..."}
- "what's my balance" → {"intent": "portfolio", "confidence": 0.8, ...}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      return {
        intent: parsed.intent || 'chat',
        confidence: parsed.confidence || 0.5,
        amount: parsed.amount,
        token: parsed.token,
        target: parsed.target,
        reasoning: parsed.reasoning || 'AI analysis',
        response: parsed.response || 'I understand you want to interact with DeFi protocols.'
      };
    } catch (parseError) {
      console.error("[Gemini] Failed to parse JSON:", parseError);
      // Fallback to simple pattern matching
      return fallbackAnalysis(message);
    }
  } catch (error) {
    console.error("[Gemini] API error:", error);
    // Fallback to simple pattern matching
    return fallbackAnalysis(message);
  }
}

// Fallback analysis when Gemini API fails
function fallbackAnalysis(message: string): GeminiResponse {
  const cleanMessage = message.trim().toLowerCase();
  
  // Casual conversation patterns
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|how are you|what's up|sup)$/i.test(cleanMessage)) {
    return {
      intent: 'chat',
      confidence: 0.9,
      reasoning: 'Detected casual greeting',
      response: "Hello! I'm your MetaArmy AI assistant. I can help you with DeFi operations like investing, transferring tokens, and yield farming. Try saying 'invest 0.01 ETH' or 'help' to see what I can do!"
    };
  }

  // Help patterns
  if (/help|what can you do|commands|guide/i.test(cleanMessage)) {
    return {
      intent: 'help',
      confidence: 0.9,
      reasoning: 'User requesting help',
      response: `I can help you with:
• Investment: "invest 0.01 ETH" or "put 5 USDC into yield farming"
• Transfers: "send 0.005 ETH" or "transfer 10 USDC"
• Portfolio: "show my balance" or "portfolio overview"
• Swaps: "swap ETH for USDC" (coming soon)
• Yield: "find best yield for USDC" (coming soon)

Just speak naturally and I'll understand your intent!`
    };
  }

  // Investment patterns
  if (/invest|put|deposit|stake/i.test(cleanMessage)) {
    const amountMatch = cleanMessage.match(/(\d+(?:\.\d+)?)\s*(eth|usdc|dai|dollars?)/i);
    return {
      intent: 'invest',
      confidence: amountMatch ? 0.8 : 0.6,
      amount: amountMatch ? amountMatch[1] : undefined,
      token: amountMatch ? (amountMatch[2].toLowerCase() === 'eth' ? 'ETH' : 'USDC') : undefined,
      reasoning: 'Detected investment intent',
      response: amountMatch 
        ? `I'll help you invest ${amountMatch[1]} ${amountMatch[2].toUpperCase()}. Let me process this for you.`
        : "I understand you want to invest. Please specify an amount and token, like 'invest 0.01 ETH'."
    };
  }

  // Transfer patterns
  if (/send|transfer|move/i.test(cleanMessage)) {
    const amountMatch = cleanMessage.match(/(\d+(?:\.\d+)?)\s*(eth|usdc|dai|dollars?)/i);
    return {
      intent: 'transfer',
      confidence: amountMatch ? 0.8 : 0.6,
      amount: amountMatch ? amountMatch[1] : undefined,
      token: amountMatch ? (amountMatch[2].toLowerCase() === 'eth' ? 'ETH' : 'USDC') : undefined,
      reasoning: 'Detected transfer intent',
      response: amountMatch 
        ? `I'll help you transfer ${amountMatch[1]} ${amountMatch[2].toUpperCase()}. Processing now.`
        : "I understand you want to transfer tokens. Please specify an amount and token, like 'send 0.01 ETH'."
    };
  }

  // Portfolio patterns
  if (/portfolio|balance|holdings|show.*money|my.*funds/i.test(cleanMessage)) {
    return {
      intent: 'portfolio',
      confidence: 0.8,
      reasoning: 'User asking about portfolio',
      response: "I'd love to show you your portfolio! The portfolio tracking feature is coming soon. For now, you can check your wallet balance directly in MetaMask."
    };
  }

  // Default to chat
  return {
    intent: 'chat',
    confidence: 0.3,
    reasoning: 'Unclear intent, defaulting to chat',
    response: "I'm not sure what you'd like to do. Try saying something like 'invest 0.01 ETH', 'transfer 5 USDC', or 'help' to see what I can do!"
  };
}

export async function generateChatResponse(message: string, context?: string): Promise<string> {
  // Check if API key is available
  if (!genAI || !apiKey) {
    console.warn("[Gemini] API key not configured, using fallback response");
    return "Hello! I'm your MetaArmy AI assistant. I can help you with DeFi operations like investing, transferring tokens, and yield farming. How can I assist you today?";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are MetaArmy AI, a friendly DeFi automation assistant. The user said: "${message}"

${context ? `Context: ${context}` : ''}

Respond as a helpful AI assistant that specializes in DeFi operations. Keep responses:
- Friendly and conversational
- Focused on DeFi and crypto
- Helpful and informative
- Brief but complete
- Professional but not robotic

If they're just chatting, be friendly. If they need help with DeFi, guide them.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("[Gemini] Chat error:", error);
    return "Hello! I'm your MetaArmy AI assistant. I can help you with DeFi operations like investing, transferring tokens, and yield farming. How can I assist you today?";
  }
}