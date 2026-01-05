'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface ConnectionHealthProps {
    onHealthChange?: (isHealthy: boolean) => void
}

export default function ConnectionHealthCheck({ onHealthChange }: ConnectionHealthProps) {
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
    const [isChecking, setIsChecking] = useState(false)
    const [lastCheck, setLastCheck] = useState<Date | null>(null)
    const [error, setError] = useState<string | null>(null)

    const checkConnectionHealth = async () => {
        setIsChecking(true)
        setError(null)

        try {
            // Use EXACT same Flask detection logic as GrantPermissions
            const findFlaskProvider = () => {
                if (typeof window === 'undefined') return null

                const ethereum = (window as any).ethereum
                if (!ethereum) return null

                // Strategy 1: Multi-provider setup
                if (ethereum.providers?.length > 0) {
                    const flask = ethereum.providers.find((p: any) =>
                        p.isMetaMaskFlask ||
                        p.info?.rdns === 'io.metamask.flask' ||
                        p.info?.name?.toLowerCase().includes('flask')
                    )
                    if (flask) return flask
                }

                // Strategy 2: Direct Flask detection
                if (ethereum.isMetaMaskFlask) return ethereum

                // Strategy 3: Generic MetaMask (let it work if permissions succeed)
                if (ethereum.isMetaMask) return ethereum

                return null
            }

            const flaskProvider = findFlaskProvider()
            if (!flaskProvider) {
                throw new Error('MetaMask not found')
            }

            // Test basic connectivity
            const accounts = await flaskProvider.request({ method: 'eth_accounts' })
            const chainId = await flaskProvider.request({ method: 'eth_chainId' })

            console.log('✅ Connection health check passed:', {
                accounts: accounts.length,
                chainId,
                hasFlaskFlag: !!(flaskProvider.isMetaMaskFlask),
                isGenericMetaMask: !!(flaskProvider.isMetaMask && !flaskProvider.isMetaMaskFlask)
            })

            setIsHealthy(true)
            setLastCheck(new Date())
            onHealthChange?.(true)

        } catch (err) {
            console.error('❌ Connection health check failed:', err)
            setIsHealthy(false)
            setError(err instanceof Error ? err.message : 'Connection issue')
            onHealthChange?.(false)
        } finally {
            setIsChecking(false)
        }
    }

    useEffect(() => {
        checkConnectionHealth()
        
        // Check health every 60 seconds (reduced from 30)
        const interval = setInterval(checkConnectionHealth, 60000)
        return () => clearInterval(interval)
    }, [])

    if (isHealthy === null) {
        return (
            <div className="flex items-center gap-2 text-sm text-white/60">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking connection...</span>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className={`flex items-center gap-2 text-sm ${
                isHealthy ? 'text-green-400' : 'text-red-400'
            }`}>
                {isHealthy ? (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        <Wifi className="w-4 h-4" />
                        <span>MetaMask connection healthy</span>
                    </>
                ) : (
                    <>
                        <AlertCircle className="w-4 h-4" />
                        <WifiOff className="w-4 h-4" />
                        <span>Connection issues detected</span>
                    </>
                )}
                
                <button
                    onClick={checkConnectionHealth}
                    disabled={isChecking}
                    className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {!isHealthy && error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Connection Problem:</p>
                            <p className="text-xs text-red-300 mt-1">{error}</p>
                        </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-red-300">
                        <p className="font-medium mb-1">Troubleshooting:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Ensure MetaMask Flask is installed and unlocked</li>
                            <li>Refresh the page and try again</li>
                            <li>Check if MetaMask is connected to the correct network</li>
                            <li>Restart MetaMask if issues persist</li>
                        </ul>
                    </div>
                </div>
            )}

            {lastCheck && (
                <div className="text-xs text-white/40">
                    Last checked: {lastCheck.toLocaleTimeString()}
                </div>
            )}
        </div>
    )
}