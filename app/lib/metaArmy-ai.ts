import { parseEther, formatEther } from "viem";
import { executeTransfer } from "./smartAccount";
import { analyzeUserIntent, generateChatResponse, type GeminiResponse } from "./gemini-ai";

// AI Intent Parser for MetaArmy
export interface AIIntent {
  action: 'invest' | 'transfer' | 'swap' | 'yield' | 'chat' | 'portfolio' | 'help';
  amount?: bigint;
  token?: string;
  target?: string;
  confidence: number;
  reasoning?: string;
  response?: string;
}

export async function parseUserIntent(message: string): Promise<AIIntent> {
  try {
    // Use Gemini AI for advanced intent analysis
    const geminiResult = await analyzeUserIntent(message);
    
    let amount: bigint | undefined;
    if (geminiResult.amount && geminiResult.token) {
      const value = parseFloat(geminiResult.amount);
      if (geminiResult.token === 'ETH') {
        amount = parseEther(value.toString());
      } else if (geminiResult.token === 'USDC') {
        amount = BigInt(Math.floor(value * 1000000)); // 6 decimals for USDC
      }
    }

    return {
      action: geminiResult.intent,
      amount,
      token: geminiResult.token,
      target: geminiResult.target,
      confidence: geminiResult.confidence,
      reasoning: geminiResult.reasoning,
      response: geminiResult.response
    };
  } catch (error) {
    console.error("[AI] Gemini analysis failed, using fallback:", error);
    return fallbackParseIntent(message);
  }
}

// Fallback parser when Gemini fails
function fallbackParseIntent(message: string): AIIntent {
  const cleanMessage = message.trim().toLowerCase();
  
  // Check if it's casual conversation
  const CASUAL_PATTERNS = /^(hi|hello|hey|good morning|good afternoon|good evening|how are you|what's up|sup)$/i;
  if (CASUAL_PATTERNS.test(cleanMessage)) {
    return {
      action: 'chat',
      confidence: 0.9,
      response: "Hello! I'm your MetaArmy AI assistant. Ready to help with your DeFi operations!"
    };
  }
  
  // Check for financial actions
  const FINANCIAL_PATTERNS = {
    invest: /invest|put|deposit|stake/i,
    transfer: /send|transfer|move/i,
    swap: /swap|exchange|trade|convert/i,
    yield: /yield|earn|farm|generate/i,
    portfolio: /portfolio|balance|holdings/i,
    help: /help|what can you do|commands/i,
    amounts: /(\d+(?:\.\d+)?)\s*(eth|usdc|dai|dollars?)/i,
    addresses: /(0x[a-fA-F0-9]{40})/,
  };

  let action: AIIntent['action'] = 'chat';
  let confidence = 0.1;
  
  if (FINANCIAL_PATTERNS.help.test(cleanMessage)) {
    action = 'help';
    confidence = 0.8;
  } else if (FINANCIAL_PATTERNS.portfolio.test(cleanMessage)) {
    action = 'portfolio';
    confidence = 0.8;
  } else if (FINANCIAL_PATTERNS.invest.test(cleanMessage)) {
    action = 'invest';
    confidence = 0.8;
  } else if (FINANCIAL_PATTERNS.transfer.test(cleanMessage)) {
    action = 'transfer';
    confidence = 0.8;
  } else if (FINANCIAL_PATTERNS.swap.test(cleanMessage)) {
    action = 'swap';
    confidence = 0.8;
  } else if (FINANCIAL_PATTERNS.yield.test(cleanMessage)) {
    action = 'yield';
    confidence = 0.8;
  }
  
  // Extract amount and token
  let amount: bigint | undefined;
  let token: string | undefined;
  
  const amountMatch = cleanMessage.match(FINANCIAL_PATTERNS.amounts);
  if (amountMatch) {
    const value = parseFloat(amountMatch[1]);
    const tokenName = amountMatch[2].toLowerCase();
    
    if (tokenName === 'eth') {
      amount = parseEther(value.toString());
      token = 'ETH';
      confidence += 0.1;
    } else if (tokenName === 'usdc' || tokenName === 'dollars') {
      amount = BigInt(Math.floor(value * 1000000)); // 6 decimals for USDC
      token = 'USDC';
      confidence += 0.1;
    }
  }
  
  // Extract target address
  let target: string | undefined;
  const addressMatch = message.match(FINANCIAL_PATTERNS.addresses);
  if (addressMatch) {
    target = addressMatch[1];
    confidence += 0.1;
  }
  
  return {
    action,
    amount,
    token,
    target,
    confidence: Math.min(confidence, 1.0)
  };
}

export async function executeAIIntent(
  intent: AIIntent,
  ctx: any,
  permission: any,
  userAddress: string
): Promise<{ success: boolean; message: string; txHash?: string }> {
  
  if (intent.action === 'chat') {
    try {
      const response = intent.response || await generateChatResponse("casual conversation");
      return {
        success: true,
        message: response
      };
    } catch (error) {
      return {
        success: true,
        message: "Hello! I'm your MetaArmy AI assistant. I can help you with DeFi operations like investing, transferring tokens, and yield farming. Try saying something like 'invest 0.01 ETH' or 'transfer 5 USDC'."
      };
    }
  }

  if (intent.action === 'help') {
    return {
      success: true,
      message: intent.response || `I can help you with:
• Investment: "invest 0.01 ETH" or "put 5 USDC into yield farming"
• Transfers: "send 0.005 ETH" or "transfer 10 USDC"
• Portfolio: "show my balance" or "portfolio overview"
• Swaps: "swap ETH for USDC" (coming soon)
• Yield: "find best yield for USDC" (coming soon)

Just speak naturally and I'll understand your intent!`
    };
  }

  if (intent.action === 'portfolio') {
    return {
      success: true,
      message: "Portfolio tracking is coming soon! For now, you can check your wallet balance directly in MetaMask or use the Portfolio tab to see placeholder data."
    };
  }
  
  if (intent.confidence < 0.7) {
    return {
      success: false,
      message: intent.response || "I'm not sure what you want to do. Please be more specific. For example: 'invest 0.01 ETH' or 'transfer 5 USDC to 0x...'."
    };
  }
  
  if (!ctx || !permission) {
    return {
      success: false,
      message: "Please setup MetaArmy permissions first by clicking the setup button in the Dashboard tab."
    };
  }
  
  try {
    switch (intent.action) {
      case 'invest':
      case 'transfer':
        if (!intent.amount || !intent.token) {
          return {
            success: false,
            message: intent.response || "Please specify an amount and token. For example: 'invest 0.01 ETH' or 'transfer 5 USDC'."
          };
        }
        
        const targetAddress = intent.target || userAddress; // Default to user's own address
        const tokenPermission = intent.token === 'ETH' ? permission.eth : permission.usdc;
        
        if (!tokenPermission) {
          return {
            success: false,
            message: `No permission granted for ${intent.token}. Please setup permissions first in the Dashboard tab.`
          };
        }
        
        const result = await executeTransfer(ctx, tokenPermission, {
          to: targetAddress,
          amount: intent.amount,
          token: intent.token
        });
        
        const amountStr = intent.token === 'ETH' 
          ? `${formatEther(intent.amount)} ETH`
          : `${Number(intent.amount) / 1000000} USDC`;
        
        return {
          success: true,
          message: `✅ Successfully executed ${intent.action} of ${amountStr} via MetaArmy smart contract!`,
          txHash: result.txHash
        };
        
      case 'swap':
        return {
          success: false,
          message: "Swap functionality is coming soon! Currently supports basic transfers and investments through the MetaArmy contract."
        };
        
      case 'yield':
        return {
          success: false,
          message: "Yield farming functionality is coming soon! Currently supports basic transfers and investments through the MetaArmy contract."
        };
        
      default:
        return {
          success: false,
          message: "I don't understand that command yet. Try 'invest 0.01 ETH', 'transfer 5 USDC', or 'help' to see what I can do."
        };
    }
  } catch (error: any) {
    console.error("[AI] Execution error:", error);
    return {
      success: false,
      message: `❌ Execution failed: ${error.message}`
    };
  }
}