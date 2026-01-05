# 🤖 Gemini AI Setup Guide

## Get Your Gemini API Key (2 minutes)

### Step 1: Go to Google AI Studio
Visit: https://makersuite.google.com/app/apikey

### Step 2: Sign In
- Use your Google account
- Accept the terms of service

### Step 3: Create API Key
1. Click "Create API Key"
2. Select "Create API key in new project" (or use existing)
3. Copy the generated API key

### Step 4: Add to Environment
Edit your `.env.local` file:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 5: Restart Development Server
```bash
npm run dev
```

## ✨ What Gemini AI Enables

With Gemini configured, Meta-Plot AI can:

### 🧠 **Advanced Intent Understanding**
- **Natural Language**: "Put my spare cash in something safe but profitable"
- **Complex Conditions**: "Invest when ETH is down but not crashing"
- **Risk Assessment**: Automatically detects conservative vs aggressive language

### 📊 **Smart Parameter Extraction**
- **Multi-Asset Support**: Handles complex portfolio instructions
- **Condition Parsing**: Understands gas limits, APY requirements, timing
- **Amount Logic**: Distinguishes between liquidity buffers and investment amounts

### 🎯 **Confidence Scoring**
- Shows how confident the AI is in its parsing
- Falls back to rule-based parsing if confidence is low
- Provides feedback for unclear instructions

## 🔧 Testing Your Setup

### Test 1: Basic Intent
Try: "Invest $500 USDC in Aave weekly"

**Expected Result**: Should parse correctly with high confidence

### Test 2: Complex Intent  
Try: "Keep $200 liquid, put the rest in the safest yield farm when gas is cheap"

**Expected Result**: Should identify conservative risk level and gas conditions

### Test 3: Fallback Test
Temporarily remove your API key and try the same inputs.

**Expected Result**: Should still work with rule-based parsing

## 🚨 Troubleshooting

### "Gemini AI unavailable" Message
- Check your API key is correct
- Verify you have internet connection
- Ensure you haven't exceeded rate limits

### "Invalid API Key" Error
- Double-check the key from Google AI Studio
- Make sure there are no extra spaces
- Verify the key is active (not revoked)

### Parsing Still Basic
- Check `.env.local` file has the correct variable name: `GEMINI_API_KEY`
- Restart your development server after adding the key
- Check browser console for any error messages

## 💡 Pro Tips

### Rate Limits
- Gemini has generous free tier limits
- For hackathon demo, you won't hit limits
- Production apps should implement caching

### Prompt Engineering
The AI prompt is optimized for DeFi use cases. You can customize it in:
`app/lib/gemini-ai.ts` - Look for the `prompt` variable

### Fallback Strategy
Even without Gemini, the app works perfectly with rule-based parsing. This ensures:
- ✅ Demo always works
- ✅ No dependency on external APIs
- ✅ Judges can test without setup

## 🎯 For Hackathon Demo

### With Gemini (Recommended)
- Shows cutting-edge AI integration
- Handles complex natural language
- Impresses judges with smart parsing

### Without Gemini (Still Great)
- Demonstrates solid engineering
- Shows proper fallback handling
- Focuses on core blockchain innovation

**Both approaches work perfectly for winning the hackathon! 🏆**

---

**Need help?** The setup script will guide you through everything:
```bash
npm run setup
```