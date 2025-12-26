'use client'

import { useAccount, useBalance, useReadContracts } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { useState, useEffect } from 'react'

const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8') as `0x${string}`
const ARMY_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_ARMY_TOKEN_ADDRESS || '0xdEb3a0D43D207ba8AD8e77F665B32B18c84Bf34a') as `0x${string}`

const ERC20_ABI = [
    {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function',
    },
] as const

export function useBlockchainData() {
    const { address, isConnected } = useAccount()

    // Real ETH Balance
    const { data: ethBalance } = useBalance({
        address,
    })

    // Real Token Balances
    const { data: tokenData } = useReadContracts({
        contracts: [
            {
                address: USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address as `0x${string}`],
            },
            {
                address: ARMY_TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address as `0x${string}`],
            },
        ],
    })

    const usdcBalance = tokenData?.[0]?.result ? formatUnits(tokenData[0].result as bigint, 6) : '0'
    const armyBalance = tokenData?.[1]?.result ? formatUnits(tokenData[1].result as bigint, 18) : '0'

    // Live Price State
    const [prices, setPrices] = useState({
        ETH: 0,
        ARMY: 0, // Unlisted - No liquid value yet
        USDC: 1
    })

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
                )
                const data = await response.json()
                if (data.ethereum?.usd) {
                    setPrices(prev => ({ ...prev, ETH: data.ethereum.usd }))
                }
            } catch (error) {
                console.error('Failed to fetch live prices:', error)
                // Fallback if API fails
                setPrices(prev => ({ ...prev, ETH: 3000 }))
            }
        }

        fetchPrices()
        // Refresh every 60 seconds
        const interval = setInterval(fetchPrices, 60000)
        return () => clearInterval(interval)
    }, [])

    const ethValue = parseFloat(ethBalance?.formatted || '0') * prices.ETH
    const armyValue = parseFloat(armyBalance) * prices.ARMY
    const usdcValue = parseFloat(usdcBalance) * prices.USDC

    const totalNetWorth = ethValue + armyValue + usdcValue

    return {
        isConnected,
        address,
        balances: {
            eth: ethBalance?.formatted || '0',
            usdc: usdcBalance,
            army: armyBalance,
        },
        values: {
            eth: ethValue,
            usdc: usdcValue,
            army: armyValue,
        },
        totalNetWorth,
        prices
    }
}

export function useTransactionHistory() {
    const { address } = useAccount()
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!address) return

        const fetchHistory = async () => {
            setLoading(true)
            try {
                // Using Etherscan Sepolia API
                const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || 'GN664MSWDSMP86M36DM79P5RXHYZMU9DGA'
                const response = await fetch(
                    `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
                )
                const data = await response.json()

                if (data.status === '1') {
                    setHistory(data.result.slice(0, 10).map((tx: any) => ({
                        id: tx.hash,
                        type: tx.to?.toLowerCase() === address.toLowerCase() ? 'RECEIVED' : 'SENT',
                        label: tx.to?.toLowerCase() === address.toLowerCase() ? 'Incoming Transfer' : 'Outgoing Transfer',
                        status: tx.isError === '0' ? 'Success' : 'Failed',
                        age: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString(),
                        gas: formatUnits(BigInt(tx.gasUsed) * BigInt(tx.gasPrice), 18) + ' ETH',
                        hash: `${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`,
                        zk: false // Mocked since Etherscan doesn't track our specific ZK proofs
                    })))
                }
            } catch (error) {
                console.error('Failed to fetch history:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
    }, [address])

    return { history, loading }
}
