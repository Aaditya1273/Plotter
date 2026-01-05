'use client'

import React, { useState } from 'react'
import {
    Settings,
    Shield,
    Zap,
    Globe,
    Database,
    AlertTriangle,
    CheckCircle,
    Save,
    RotateCcw,
    ExternalLink,
    Cpu,
    Network,
    Key
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ConfigSettings {
    riskAppetite: 'conservative' | 'moderate' | 'aggressive'
    gasLimit: string
    slippageTolerance: string
    autoExecute: boolean
    maxSwarmSize: string
    executionDelay: string
}

export function ArmyConfiguration() {
    const [settings, setSettings] = useState<ConfigSettings>({
        riskAppetite: 'moderate',
        gasLimit: '15000000',
        slippageTolerance: '2.5',
        autoExecute: false,
        maxSwarmSize: '10',
        executionDelay: '30'
    })

    const [hasChanges, setHasChanges] = useState(false)

    const handleSettingChange = (key: keyof ConfigSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }))
        setHasChanges(true)
    }

    const handleSave = () => {
        // Save to localStorage for now (in production, this would save to user preferences)
        localStorage.setItem('metaarmy-config', JSON.stringify(settings))
        toast.success('Army configuration saved successfully!')
        setHasChanges(false)
    }

    const handleReset = () => {
        setSettings({
            riskAppetite: 'moderate',
            gasLimit: '15000000',
            slippageTolerance: '2.5',
            autoExecute: false,
            maxSwarmSize: '10',
            executionDelay: '30'
        })
        setHasChanges(true)
        toast.success('Settings reset to defaults')
    }

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'conservative': return 'bg-green-50 text-green-600 border-green-200'
            case 'moderate': return 'bg-yellow-50 text-yellow-600 border-yellow-200'
            case 'aggressive': return 'bg-red-50 text-red-600 border-red-200'
            default: return 'bg-gray-50 text-gray-600 border-gray-200'
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Army <span className="text-indigo-600">Configuration</span></h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Customize Your MetaArmy Behavior</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save className="w-3 h-3" />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Configuration Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Risk Management */}
                <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Risk Management</h3>
                            <p className="text-xs text-gray-500">Control your army's risk tolerance</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Risk Appetite</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['conservative', 'moderate', 'aggressive'] as const).map((risk) => (
                                    <button
                                        key={risk}
                                        onClick={() => handleSettingChange('riskAppetite', risk)}
                                        className={`p-3 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all ${settings.riskAppetite === risk
                                                ? getRiskColor(risk)
                                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        {risk}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Gas Limit</label>
                            <input
                                type="text"
                                value={settings.gasLimit}
                                onChange={(e) => handleSettingChange('gasLimit', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                                placeholder="15000000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Slippage Tolerance (%)</label>
                            <input
                                type="text"
                                value={settings.slippageTolerance}
                                onChange={(e) => handleSettingChange('slippageTolerance', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                                placeholder="2.5"
                            />
                        </div>
                    </div>
                </div>

                {/* Network Configuration */}
                <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Network className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Network Status</h3>
                            <p className="text-xs text-gray-500">Current network configuration</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <p className="text-sm font-bold text-green-900">Network Status</p>
                            </div>
                            <p className="text-xs text-green-700 mb-3">Connected to Sepolia Testnet</p>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="text-gray-500 font-medium">Chain ID</p>
                                    <p className="font-bold text-gray-900">11155111</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium">Block Height</p>
                                    <p className="font-bold text-gray-900">Latest</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Cpu className="w-4 h-4 text-blue-600" />
                                <p className="text-sm font-bold text-blue-900">AI Processing</p>
                            </div>
                            <p className="text-xs text-blue-700">Gemini AI integration active</p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-xs text-gray-600 mb-2">
                                <strong>Security Note:</strong> Network endpoints are configured securely on the backend.
                                Frontend configuration has been disabled for production security.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Execution Settings */}
                <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Zap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Execution Control</h3>
                            <p className="text-xs text-gray-500">Swarm execution parameters</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Max Swarm Size</label>
                            <input
                                type="text"
                                value={settings.maxSwarmSize}
                                onChange={(e) => handleSettingChange('maxSwarmSize', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                                placeholder="10"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Execution Delay (seconds)</label>
                            <input
                                type="text"
                                value={settings.executionDelay}
                                onChange={(e) => handleSettingChange('executionDelay', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:outline-none"
                                placeholder="30"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div>
                                <p className="text-sm font-bold text-gray-900">Auto Execute</p>
                                <p className="text-xs text-gray-500">Automatically execute approved swarms</p>
                            </div>
                            <button
                                onClick={() => handleSettingChange('autoExecute', !settings.autoExecute)}
                                className={`w-12 h-6 rounded-full transition-all ${settings.autoExecute ? 'bg-indigo-600' : 'bg-gray-300'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-all ${settings.autoExecute ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Security & Privacy</h3>
                            <p className="text-xs text-gray-500">ZK-proof and security settings</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div>
                                <p className="text-sm font-bold text-gray-900">Permission Integrity Check</p>
                                <p className="text-xs text-gray-500">Automatically verify ERC-7715 signatures before execution</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                                <CheckCircle className="w-3 h-3" />
                                <span className="text-[8px] font-black uppercase">Enforced</span>
                            </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <p className="text-sm font-bold text-green-900">Security Status</p>
                            </div>
                            <p className="text-xs text-green-700">All security protocols are active and functioning correctly.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Footer */}
            <div className="bg-gray-900 rounded-[3rem] p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black mb-2">Configuration Status</h3>
                        <p className="text-white/60 text-sm">Current army configuration is optimized for {settings.riskAppetite} risk tolerance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <span className="text-xs font-bold text-white/80">ACTIVE</span>
                    </div>
                </div>
            </div>
        </div>
    )
}