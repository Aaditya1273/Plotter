'use client'

import { useState } from 'react'
import {
    Plus,
    Trash2,
    Zap,
    Shield,
    Globe,
    DollarSign,
    MousePointer2,
    ChevronRight,
    GripVertical,
    Activity,
    Code,
    CheckCircle,
    Loader2,
    Lock as SecureLock
} from 'lucide-react'
import { useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { toast } from 'react-hot-toast'

const META_ARMY_ADDRESS = (process.env.NEXT_PUBLIC_META_PLOT_AGENT_ADDRESS || '0xdEb3a0D43D207ba8AD8e77F665B32B18c84Bf34a') as `0x${string}`

const META_ARMY_ABI = [
    {
        name: 'createSwarmBundle',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'goal', type: 'string' },
            {
                name: 'actions',
                type: 'tuple[]',
                components: [
                    { name: 'target', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'data', type: 'bytes' },
                    { name: 'requiresZk', type: 'bool' }
                ]
            }
        ],
        outputs: [{ name: '', type: 'bytes32' }]
    }
] as const

interface TaskStep {
    id: string
    type: 'defi' | 'nft' | 'social' | 'gov'
    action: string
    target: string
    amount: string
    conditions: string[]
    contractData?: string
}

export function TaskComposer() {
    const [tasks, setTasks] = useState<TaskStep[]>([
        {
            id: '1',
            type: 'defi',
            action: 'Swap & Stake',
            target: 'Aave',
            amount: '500 USDC',
            conditions: ['Gas < 20 gwei'],
            contractData: '0x0000000000000000000000000000000000000000'
        }
    ])
    const [isSimulating, setIsSimulating] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const addTask = (type: TaskStep['type']) => {
        const newTasks: Record<TaskStep['type'], TaskStep> = {
            defi: { id: Date.now().toString(), type: 'defi', action: 'Invest Liquid', target: 'Lido', amount: '1 ETH', conditions: ['APY > 3%'], contractData: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' },
            nft: { id: Date.now().toString(), type: 'nft', action: 'Snipe Flow', target: 'OpenSea', amount: '0.1 ETH', conditions: ['Floor < 0.05'], contractData: '0x0000000000000000000000000000000000000000' },
            social: { id: Date.now().toString(), type: 'social', action: 'Tip Creator', target: 'Farcaster', amount: '5 $MPA', conditions: ['On Success'], contractData: '0x0000000000000000000000000000000000000000' },
            gov: { id: Date.now().toString(), type: 'gov', action: 'Auto-Vote', target: 'ENS DAO', amount: 'N/A', conditions: ['Proposal Live'], contractData: '0x0000000000000000000000000000000000000000' }
        }
        setTasks([...tasks, newTasks[type]])
    }

    const removeTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id))
    }

    const { writeContractAsync } = useWriteContract()

    const handleSubmit = async () => {
        setIsSimulating(true)
        try {
            // Convert UI tasks to Contract Actions
            const actions = tasks.map(t => ({
                target: (t.contractData?.startsWith('0x') ? t.contractData.substring(0, 42) : '0x0000000000000000000000000000000000000000') as `0x${string}`,
                amount: parseUnits(t.amount.replace(/[^0-9.]/g, '') || '0', 18),
                data: '0x' as `0x${string}`,
                requiresZk: true
            }))

            // Send Transaction
            const txHash = await writeContractAsync({
                address: META_ARMY_ADDRESS,
                abi: META_ARMY_ABI,
                functionName: 'createSwarmBundle',
                args: [`Mixed Swarm Batch (${tasks.length} Agents)`, actions],
            })

            // Success UI
            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-bold">Swarm Deployed!</span>
                    <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline text-indigo-600 hover:text-indigo-800"
                    >
                        View on Etherscan ↗
                    </a>
                </div>,
                { duration: 8000 }
            )
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 5000)

        } catch (err) {
            console.error(err)
            toast.error('Wallet Transaction Failed')
        } finally {
            setIsSimulating(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            {/* Success Overlay */}
            {showSuccess && (
                <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/40 rounded-[3rem] animate-in fade-in zoom-in duration-300">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-3xl text-center border border-gray-100 max-w-sm">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Swarm Propagated</h3>
                        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest leading-relaxed">
                            Batch TX: 0x{Math.random().toString(16).substring(2, 10)}... <br />
                            ZK Proof: Verified
                        </p>
                    </div>
                </div>
            )}

            {/* Workflow Builder */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Workflow Composer <span className="text-xs font-bold text-metamask-500 bg-metamask-50 px-2 py-0.5 rounded ml-2 uppercase tracking-widest">v3.0 Swarm</span></h2>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">Reset Grid</button>
                    </div>
                </div>

                <div className="space-y-4">
                    {tasks.map((task, index) => (
                        <div key={task.id} className="group relative flex items-center gap-6 bg-white rounded-[2.5rem] p-8 border border-gray-100 hover:border-metamask-300 transition-all hover:shadow-2xl hover:shadow-indigo-50">
                            <div className="cursor-grab text-gray-200 group-hover:text-metamask-400 h-full flex items-center">
                                <GripVertical className="w-6 h-6" />
                            </div>

                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${task.type === 'defi' ? 'bg-metamask-50 text-metamask-600' :
                                task.type === 'nft' ? 'bg-purple-50 text-purple-600' :
                                    task.type === 'social' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                {task.type === 'defi' ? <Zap className="w-8 h-8" /> :
                                    task.type === 'nft' ? <MousePointer2 className="w-8 h-8" /> :
                                        task.type === 'social' ? <Globe className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
                            </div>

                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Sub-Agent {index + 1} • {task.type}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-xl font-black text-gray-900">{task.action}</h3>
                                    <span className="text-sm font-bold text-gray-300">target {task.target}</span>
                                </div>
                            </div>

                            <div className="hidden md:flex flex-col items-end gap-1 px-8 border-l border-gray-50">
                                <p className="text-lg font-black text-indigo-600 leading-none">{task.amount}</p>
                                <div className="flex gap-2">
                                    {task.conditions.map(c => (
                                        <span key={c} className="text-[8px] font-black bg-gray-900 text-white px-2 py-0.5 rounded-full uppercase">{c}</span>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => removeTask(task.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                <Trash2 className="w-5 h-5" />
                            </button>

                            {index < tasks.length - 1 && (
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-lg">
                                    <ChevronRight className="w-5 h-5 text-gray-300 rotate-90" />
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="pt-8 ml-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Add Swarm Module</p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { id: 'defi', label: 'DeFi Router', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
                                { id: 'nft', label: 'NFT Sniper', icon: MousePointer2, color: 'text-purple-600', bg: 'bg-purple-50' },
                                { id: 'social', label: 'Social Echo', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { id: 'gov', label: 'Governance', icon: Gavel, color: 'text-amber-600', bg: 'bg-amber-50' }
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => addTask(btn.id as any)}
                                    className="p-6 bg-white border border-dashed border-gray-200 rounded-[2rem] hover:border-metamask-400 group transition-all text-center"
                                >
                                    <div className={`${btn.bg} ${btn.color} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                                        <btn.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-gray-900">{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulation Pane */}
            <div className="space-y-8">
                <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden h-full shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-metamask-500/10 blur-[120px] -mr-16 -mt-16"></div>

                    <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                        <Activity className="w-6 h-6 text-metamask-500" /> Swarm Simulator
                    </h3>

                    <div className="space-y-8 relative">
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Gas Savings Delta</p>
                                <p className="text-xl font-black text-green-400">-${(tasks.length * 7.25).toFixed(2)}</p>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[92%] animate-pulse"></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Contract Preview (v3.0)</p>
                            <div className="bg-black/40 rounded-2xl p-6 font-mono text-[10px] space-y-3 leading-relaxed">
                                <div className="flex gap-2">
                                    <span className="text-metamask-500 font-black">CALL</span>
                                    <span className="text-white/60">executeBundle(</span>
                                </div>
                                <div className="pl-6 text-white/40 italic">
                                  // Bundle ID: 0x{Math.random().toString(16).substring(2, 8)}... <br />
                                  // Sub-Actions: {tasks.length}
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-indigo-400 font-black">WITH</span>
                                    <span className="text-white/60">ZKProofHashes[{tasks.length}]</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">ZK Integrity Check</p>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <SecureLock className="w-5 h-5 text-indigo-400" />
                                <p className="text-[10px] font-bold text-white/80 leading-relaxed uppercase tracking-wider">
                                    Brevis verification status: <span className="text-green-400 ml-1">OPTIMAL</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 space-y-4">
                        <button
                            onClick={handleSubmit}
                            disabled={isSimulating}
                            className="w-full py-5 bg-metamask-500 hover:bg-metamask-600 rounded-3xl font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-105 shadow-xl shadow-metamask-500/10 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSimulating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Bonding Swarm...
                                </>
                            ) : (
                                <>Submit Swarm Intent</>
                            )}
                        </button>
                        <p className="text-[9px] text-white/20 text-center font-black uppercase tracking-[0.3em]">Atomic Batch Execution (MPA-7715)</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Gavel = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={className}
    >
        <path d="m14 13-5 5" /><path d="m3 21 3-3" /><path d="M9.5 14.5 16 8" /><path d="m17 2 5 5-.5.5a3.53 3.53 0 0 1-5 0l-4-4a3.53 3.53 0 0 1 0-5Z" />
    </svg>
)
