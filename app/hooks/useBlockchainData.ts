'use client'

import { useAccount, useBalance, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { useState, useEffect, useMemo } from 'react'
import { CONTRACTS } from '@/lib/constants'

const USDC_ADDRESS = CONTRACTS.USDC as `0x${string}`
const ARMY_TOKEN_ADDRESS = CONTRACTS.ARMY_TOKEN as `0x${string}`

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
                // Temporarily disable CoinGecko due to CORS issues
                // Use fallback prices for now
                setPrices(prev => ({
                    ...prev,
                    ETH: 3000 // Fallback ETH price
                }))

                // TODO: Implement server-side price fetching API route
                console.log('Using fallback prices due to CORS restrictions')
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

    // Memoize the returned objects to prevent infinite re-renders
    const balances = useMemo(() => ({
        eth: ethBalance?.formatted || '0',
        usdc: usdcBalance,
        army: armyBalance,
    }), [ethBalance?.formatted, usdcBalance, armyBalance])

    const values = useMemo(() => ({
        eth: ethValue,
        usdc: usdcValue,
        army: armyValue,
    }), [ethValue, usdcValue, armyValue])

    return {
        isConnected,
        address,
        balances,
        values,
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

        const fetchMetaArmyHistory = async () => {
            setLoading(true)
            try {

                // Fetch MetaArmy contract transactions from our API route
                const metaArmyAddress = CONTRACTS.META_PLOT_AGENT

                // Fetch user's transactions directly from Etherscan
                const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
                if (!apiKey) {
                    return []
                }

                const response = await fetch(
                    `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
                )

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`)
                }

                const txData = await response.json()

                // Check for any API errors
                if (txData.status === '0') {
                    if (txData.message === 'NOTOK') {

                        // If it's a V1 deprecation error, try alternative approach
                        if (txData.result?.includes('deprecated') || txData.result?.includes('V1 endpoint')) {

                            // Try using the /api/etherscan route instead
                            try {
                                const altResponse = await fetch(`/api/etherscan?address=${address}`)
                                if (altResponse.ok) {
                                    const altData = await altResponse.json()
                                    if (altData.status === '1' && altData.result) {
                                        txData.status = '1'
                                        txData.result = altData.result
                                    } else {
                                        setHistory([])
                                        return
                                    }
                                } else {
                                    setHistory([])
                                    return
                                }
                            } catch (altError) {
                                setHistory([])
                                return
                            }
                        } else {
                            setHistory([])
                            return
                        }
                    } else {
                        setHistory([])
                        return
                    }
                }

                if (txData.status === '1' && txData.result) {
                    // Filter transactions to MetaArmy contract
                    const metaArmyTxs = txData.result.filter((tx: any) => {
                        const isToContract = tx.to?.toLowerCase() === metaArmyAddress.toLowerCase()
                        const isSuccessful = tx.isError === '0'

                        return isToContract && isSuccessful
                    }).slice(0, 10)

                    console.log('✅ Found MetaArmy transactions for history:', metaArmyTxs.length)

                    const processedHistory = metaArmyTxs.map((tx: any) => {
                        let type = 'SWARM_DEPLOYMENT'
                        let label = 'Swarm Bundle Deployed'

                        // Try to determine the type based on input data
                        if (tx.input && tx.input.length > 10) {
                            const inputData = tx.input.toLowerCase()

                            // Look for function signatures or patterns
                            if (inputData.includes('createswarm') || inputData.includes('bundle')) {
                                type = 'SWARM_DEPLOYMENT'
                                label = 'Swarm Bundle Created'
                            } else if (inputData.includes('execute')) {
                                type = 'SWARM_EXECUTION'
                                label = 'Swarm Bundle Executed'
                            } else {
                                type = 'CONTRACT_INTERACTION'
                                label = 'MetaArmy Interaction'
                            }
                        }

                        // Calculate gas cost in a readable format
                        let gasCost = 'Unknown'
                        try {
                            if (tx.gasUsed && tx.gasPrice) {
                                const gasCostWei = BigInt(tx.gasUsed) * BigInt(tx.gasPrice)
                                const gasCostEth = parseFloat(formatUnits(gasCostWei, 18))
                                gasCost = `${(gasCostEth * 1000).toFixed(2)}k gwei`
                            }
                        } catch (e) {
                            gasCost = 'Optimized'
                        }

                        return {
                            id: tx.hash,
                            type,
                            label,
                            status: tx.isError === '0' ? 'Success' : 'Failed',
                            age: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString(),
                            gas: gasCost,
                            hash: `${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`,
                            isDelegated: true, // MetaArmy transactions use delegated execution
                            amount: tx.value !== '0' ? `${formatUnits(BigInt(tx.value), 18)} ETH` : '',
                            protocol: 'MetaArmy',
                            fullHash: tx.hash // Store full hash for Etherscan links
                        }
                    })

                    setHistory(processedHistory)
                } else {
                    setHistory([])
                }
            } catch (error) {
                setHistory([])
            } finally {
                setLoading(false)
            }
        }

        fetchMetaArmyHistory()
    }, [address])

    return { history, loading }
}
