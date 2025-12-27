import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      )
    }
    
    const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Etherscan API key not configured' },
        { status: 500 }
      )
    }
    
    console.log('🔍 Fetching transactions for address:', address)
    
    // Use Sepolia Etherscan API V2 with proper error handling
    const etherscanUrl = `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
    
    const response = await fetch(etherscanUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'MetaArmy/1.0',
        'Accept': 'application/json',
      },
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Etherscan API returned ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    console.log('📡 Etherscan API response status:', data.status)
    console.log('📊 Transaction count:', data.result?.length || 0)
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
    
  } catch (error: any) {
    console.error('❌ Etherscan API route error:', error)
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - Etherscan API is slow' },
        { status: 408 }
      )
    }
    
    if (error.message.includes('ENOTFOUND')) {
      return NextResponse.json(
        { error: 'Network error - Cannot reach Etherscan API' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: `API Error: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}