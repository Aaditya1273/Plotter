import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

const client = createPublicClient({
  chain: sepolia,
  transport: http()
})

export async function POST(request: NextRequest) {
  try {
    const { address, abi, functionName, args } = await request.json()
    
    if (!address || !abi || !functionName) {
      return NextResponse.json(
        { error: 'Missing required parameters: address, abi, functionName' },
        { status: 400 }
      )
    }
    
    console.log('📋 Contract read request:', {
      address,
      functionName,
      args: args?.map((arg: any) => typeof arg === 'string' ? arg.substring(0, 10) + '...' : arg)
    })
    
    const result = await client.readContract({
      address: address as `0x${string}`,
      abi,
      functionName,
      args: args || []
    })
    
    console.log('✅ Contract read result:', result)
    
    // Convert BigInt values to strings for JSON serialization
    const serializedResult = JSON.parse(JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ))
    
    return NextResponse.json(serializedResult, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
    
  } catch (error: any) {
    
    return NextResponse.json(
      { error: `Contract read failed: ${error.message}` },
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