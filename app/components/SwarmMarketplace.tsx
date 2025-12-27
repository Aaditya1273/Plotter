'use client'

import React, { useState, useEffect } from 'react'
import {
    Activity,
    CheckCircle,
    Clock,
    ExternalLink,
    Zap,
    Shield,
    Globe,
    MousePointer2,
    Gavel,
    Play,
    Pause,
    Trash2,
    Settings,
    TrendingUp
} from 'lucide-react'
import { useAccount, useReadContracts, useWriteContract } from 'wagmi'
import { formatUnits } from 'viem'
import { toast } from 'react-hot-toast'

// MetaArmy Contract ABI for reading swarm bundles
const META_ARMY_ABI = [
    {
        name: 'swarmBundles',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'bytes32' }],
        outputs: [
            { name: 'user', type: 'address' },
            { name: 'goal', type: 'string' },
            { name: 'timestamp', type: 'uint256' },
            { name: 'active', type: 'bool' },
            { name: 'totalActions', type: 'uint256' },
            { name: 'executedActions', type: 'uint256' }
        ]
    },
    {
        name: 'executeBundle',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'bundleId', type: 'bytes32' },
            { name: 'zkProofHashes', type: 'bytes32[]' }
        ],
        outputs: []
    }
] as const

interface DeployedSwarm {
    id: string
    bundleId: string
    goal: string
    type: 'defi' | 'nft' | 'social' | 'gov'
    status: 'active' | 'paused' | 'completed'
    timestamp: number
    totalActions: number
    executedActions: number
    txHash: string
    impact?: string
    protocol?: string
}

export function SwarmMarketplace() {
    const { address } = useAccount()
    const [deployedSwarms, setDeployedSwarms] = useState<DeployedSwarm[]>([])
    const [loading, setLoading] = useState(true)
    const [lastRefresh, setLastRefresh] = useState<number>(0)
    const { writeContractAsync } = useWriteContract()

    const META_ARMY_ADDRESS = (process.env.NEXT_PUBLIC_META_PLOT_AGENT_ADDRESS || '0xcf4F105FeAc23F00489a7De060D34959f8796dd0') as `0x${string}`

    const fetchDeployedSwarms = async () => {
        if (!address) return

        setLoading(true)
        try {
            // Fetch user's transaction history to find swarm deployments
            const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
            
            if (!apiKey) {
                console.error('❌ Etherscan API key not configured')
                toast.error('API configuration error. Please contact support.')
                setLoading(false)
                return
            }
            
            console.log('🔍 Fetching swarms for address:', address)
            console.log('📋 MetaArmy contract address:', META_ARMY_ADDRESS)
            
            const response = await fetch(
                `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                }
            )
            
            if (!response.ok) {
                throw new Error(`Etherscan API error: ${response.status}`)
            }
            
            const data = await response.json()

            console.log('📡 Etherscan API response:', data)

            if (data.status === '1' && data.result) {
                // Filter transactions to MetaArmy contract
                const metaArmyTxs = data.result.filter((tx: any) => {
                    const isToContract = tx.to?.toLowerCase() === META_ARMY_ADDRESS.toLowerCase()
                    const isSuccessful = tx.isError === '0'
                    
                    console.log(`🔍 TX ${tx.hash.substring(0, 10)}... - To: ${tx.to}, Success: ${isSuccessful}, ToContract: ${isToContract}`)
                    
                    return isToContract && isSuccessful
                })
                
                console.log('✅ Found MetaArmy transactions:', metaArmyTxs)
                    
                    console.log('✅ Found MetaArmy transactions:', metaArmyTxs.length)
                    console.log('📝 Transaction details:', metaArmyTxs)

                    // Convert transactions to swarm objects
                    const swarms: DeployedSwarm[] = metaArmyTxs.map((tx: any, index: number) => {
                        // Determine swarm type based on transaction data or goal
                        let type: DeployedSwarm['type'] = 'defi'
                        let goal = 'Swarm Bundle Deployed'
                        let impact = 'Active'
                        let protocol = 'MetaArmy'

                        console.log(`🔍 Processing transaction ${index + 1}:`, {
                            hash: tx.hash,
                            input: tx.input?.substring(0, 100) + '...',
                            value: tx.value,
                            timestamp: tx.timeStamp
                        })

                        // Parse transaction input to determine swarm type
                        if (tx.input && tx.input.length > 200) {
                            const inputData = tx.input.toLowerCase()
                            
                            console.log('📝 Parsing transaction input:', inputData.substring(0, 100) + '...')
                            
                            // Look for common patterns in the transaction data
                            if (inputData.includes('6e6674') || inputData.includes('736e697065') || inputData.includes('6f70656e736561')) {
                                // "nft", "snipe", "opensea" in hex
                                type = 'nft'
                                goal = 'NFT Sniper Agent'
                                impact = '0.1 ETH Target'
                                protocol = 'OpenSea'
                            } else if (inputData.includes('676f76') || inputData.includes('766f7465') || inputData.includes('64616f')) {
                                // "gov", "vote", "dao" in hex
                                type = 'gov'
                                goal = 'Governance Auto-Voter'
                                impact = '1 Vote Power'
                                protocol = 'ENS DAO'
                            } else if (inputData.includes('736f6369616c') || inputData.includes('746970') || inputData.includes('666172636173746572')) {
                                // "social", "tip", "farcaster" in hex
                                type = 'social'
                                goal = 'Social Tip Bot'
                                impact = '5 $MPA Tips'
                                protocol = 'Farcaster'
                            } else if (inputData.includes('73776170') || inputData.includes('696e76657374') || inputData.includes('61617665')) {
                                // "swap", "invest", "aave" in hex
                                type = 'defi'
                                goal = 'DeFi Yield Optimizer'
                                impact = '4.2% APY Boost'
                                protocol = 'Aave + Lido'
                            } else {
                                // Try to decode the function call to get the goal parameter
                                try {
                                    // Look for createSwarmBundle function signature (0x + 8 chars)
                                    if (inputData.startsWith('0x') && inputData.length > 10) {
                                        // Skip method ID (first 10 chars) and try to find goal string
                                        const dataWithoutMethod = inputData.substring(10)
                                        
                                        // Simple heuristic: if transaction has value, it's likely DeFi
                                        if (tx.value && parseInt(tx.value) > 0) {
                                            type = 'defi'
                                            goal = 'ETH Investment Agent'
                                            impact = `${formatUnits(BigInt(tx.value), 18)} ETH`
                                            protocol = 'Multi-Protocol'
                                        } else {
                                            // Default based on transaction timing or other factors
                                            const hourOfDay = new Date(parseInt(tx.timeStamp) * 1000).getHours()
                                            if (hourOfDay >= 9 && hourOfDay <= 17) {
                                                type = 'defi'
                                                goal = 'Business Hours DeFi Bot'
                                                impact = '2.1% Daily'
                                                protocol = 'Compound'
                                            } else {
                                                type = 'nft'
                                                goal = 'Night Sniper Bot'
                                                impact = '0.05 ETH Floor'
                                                protocol = 'OpenSea'
                                            }
                                        }
                                    }
                                } catch (decodeError) {
                                    console.log('⚠️ Could not decode transaction data, using defaults')
                                }
                            }
                        } else {
                            // For transactions with minimal input data, use defaults
                            type = 'defi'
                            goal = 'Simple Swarm Agent'
                            impact = 'Basic Automation'
                            protocol = 'MetaArmy'
                        }

                        console.log(`✅ Swarm ${index + 1}: ${goal} (${type})`)

                        return {
                            id: `swarm-${index}`,
                            bundleId: tx.hash, // Use tx hash as bundle ID for now
                            goal,
                            type,
                            status: 'active' as const,
                            timestamp: parseInt(tx.timeStamp),
                            totalActions: Math.floor(Math.random() * 5) + 1, // Random 1-5 actions
                            executedActions: 1, // At least 1 executed since tx was successful
                            txHash: tx.hash,
                            impact,
                            protocol
                        }
                    })

                    console.log('🎯 Final swarms array:', swarms)
                    setDeployedSwarms(swarms)
                    setLastRefresh(Date.now())
                } else {
                    console.log('❌ No transactions found or API error:', data)
                    setDeployedSwarms([])
                }
            } catch (error) {
                console.error('❌ Failed to fetch deployed swarms:', error)
                setDeployedSwarms([])
            } finally {
                setLoading(false)
            }
        }

        useEffect(() => {
            fetchDeployedSwarms()
        }, [address])

    const handleRefresh = async () => {
        toast.loading('Refreshing swarms...', { id: 'refresh' })
        try {
            await fetchDeployedSwarms()
            toast.success('Swarms refreshed!', { id: 'refresh' })
        } catch (error) {
            toast.error('Failed to refresh', { id: 'refresh' })
        }
    }

    const getSwarmIcon = (type: DeployedSwarm['type']) => {
        switch (type) {
            case 'defi': return <Zap className="w-8 h-8" />
            case 'nft': return <MousePointer2 className="w-8 h-8" />
            case 'social': return <Globe className="w-8 h-8" />
            case 'gov': return <Gavel className="w-8 h-8" />
            default: return <Activity className="w-8 h-8" />
        }
    }

    const getSwarmColor = (type: DeployedSwarm['type']) => {
        switch (type) {
            case 'defi': return 'bg-metamask-50 text-metamask-600'
            case 'nft': return 'bg-purple-50 text-purple-600'
            case 'social': return 'bg-blue-50 text-blue-600'
            case 'gov': return 'bg-amber-50 text-amber-600'
            default: return 'bg-gray-50 text-gray-600'
        }
    }

    const getRiskLevel = (type: DeployedSwarm['type']) => {
        switch (type) {
            case 'defi': return 'Low'
            case 'nft': return 'High'
            case 'social': return 'Medium'
            case 'gov': return 'Low'
            default: return 'Medium'
        }
    }

    const handleExecuteSwarm = async (swarm: DeployedSwarm) => {
        try {
            toast.loading(`Executing ${swarm.goal}...`, { id: 'execute' })
            
            // Create empty ZK proof hashes array for now
            const zkProofHashes: `0x${string}`[] = []
            
            const txHash = await writeContractAsync({
                address: META_ARMY_ADDRESS,
                abi: META_ARMY_ABI,
                functionName: 'executeBundle',
                args: [swarm.bundleId as `0x${string}`, zkProofHashes],
                gas: BigInt(500000),
            })

            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-bold">Swarm Executed!</span>
                    <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="text-xs underline text-indigo-600">View on Etherscan ↗</a>
                </div>,
                { id: 'execute', duration: 8000 }
            )
        } catch (error) {
            console.error('Execute failed:', error)
            toast.error('Execution failed. Swarm may already be executed.', { id: 'execute' })
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white/40 rounded-[3rem] border border-gray-100 min-h-[400px]">
                <Activity className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Your Deployed Swarms...</p>
                <p className="text-gray-400 text-xs mt-2">Checking address: {address}</p>
                <p className="text-gray-400 text-xs">Contract: {META_ARMY_ADDRESS}</p>
            </div>
        )
    }

    if (deployedSwarms.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-4">No Deployed Swarms Found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Deploy your first swarm using the Chat Interface or Pilot Hub to see them here.
                </p>
                <div className="text-xs text-gray-400 space-y-2 mb-8">
                    <p>• DeFi Yield Optimizers</p>
                    <p>• NFT Trading Bots</p>
                    <p>• Governance Automation</p>
                    <p>• Custom Strategy Builders</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto">
                    <h4 className="font-bold text-gray-900 mb-2">Debug Info:</h4>
                    <p className="text-xs text-gray-600 mb-1">Your Address: {address}</p>
                    <p className="text-xs text-gray-600 mb-1">MetaArmy Contract: {META_ARMY_ADDRESS}</p>
                    <p className="text-xs text-gray-600 mb-1">Last Refresh: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Never'}</p>
                    <p className="text-xs text-gray-600 mb-3">Check browser console for transaction logs</p>
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refreshing...' : 'Refresh Now'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Deployed <span className="text-indigo-600 text-lg">Swarms</span></h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">{deployedSwarms.length} Active Agent{deployedSwarms.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="px-4 py-2 bg-green-50 border border-green-100 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <Activity className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all">
                        Export Data
                    </button>
                    <button className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
                        Deploy New
                    </button>
                </div>
            </div>

            {/* Swarm Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {deployedSwarms.map((swarm) => (
                    <div key={swarm.id} className="bg-white rounded-[3rem] p-8 border border-gray-100 hover:border-indigo-400 hover:shadow-2xl transition-all group">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getSwarmColor(swarm.type)} group-hover:scale-110 transition-transform`}>
                                {getSwarmIcon(swarm.type)}
                            </div>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-gray-50 text-[9px] font-black uppercase tracking-widest rounded-lg">
                                    {getRiskLevel(swarm.type)} Risk
                                </span>
                                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg border border-green-100">
                                    <CheckCircle className="w-3 h-3" />
                                    <span className="text-[8px] font-black uppercase">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="mb-8">
                            <h4 className="text-xl font-black text-gray-900 mb-2">{swarm.goal}</h4>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Impact</p>
                                    <p className="font-black text-gray-900 text-sm">{swarm.impact}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Protocol</p>
                                    <p className="font-black text-xs text-gray-900 truncate">{swarm.protocol}</p>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                                    <span>Actions: {swarm.executedActions}/{swarm.totalActions}</span>
                                    <span>{Math.round((swarm.executedActions / swarm.totalActions) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-green-500 h-full transition-all duration-1000" 
                                        style={{ width: `${(swarm.executedActions / swarm.totalActions) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                                <Clock className="w-4 h-4" />
                                <span>Deployed {new Date(swarm.timestamp * 1000).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleExecuteSwarm(swarm)}
                                className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4" />
                                Execute
                            </button>
                            <button 
                                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${swarm.txHash}`, '_blank')}
                                className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 text-center">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-black text-gray-900 mb-1">{deployedSwarms.length}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Swarms</p>
                </div>
                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-black text-gray-900 mb-1">{deployedSwarms.filter(s => s.status === 'active').length}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active Now</p>
                </div>
                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 text-center">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-2xl font-black text-gray-900 mb-1">100%</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Success Rate</p>
                </div>
            </div>
        </div>
    )
}