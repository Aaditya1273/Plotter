"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useConnect, usePublicClient, useWalletClient, useChainId, useSwitchChain } from "wagmi";
import { createSessionAccount, grantPermissions, initSmartAccountContext, executeTransfer } from "./lib/smartAccount";
import { parseUserIntent, executeAIIntent } from "./lib/metaArmy-ai";
import { generateChatResponse } from "./lib/gemini-ai";
import { parseEther, formatEther } from "viem";
import { 
  MessageSquare, 
  Home, 
  Briefcase, 
  History, 
  Shield, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Bot,
  User,
  Send,
  BarChart3,
  TrendingUp,
  Activity,
  Lock,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink
} from "lucide-react";

const SEPOLIA_CHAIN_ID = 11155111;

function HomePage() {
  const [sessionAccount, setSessionAccount] = useState<any>(null);
  const [ctx, setCtx] = useState<any>(null);
  const [permission, setPermission] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [switchingChain, setSwitchingChain] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [logs, setLogs] = useState<Array<{time: string, message: string}>>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'ai', message: string, timestamp: string}>>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState('$0.00');
  const [showToast, setShowToast] = useState<{show: boolean, message: string, txHash?: string}>({show: false, message: ''});
  const [aiProcessing, setAiProcessing] = useState(false);

  const { address, isConnected, connector } = useAccount();
  
  // Load data for current address
  useEffect(() => {
    if (!address) return;
    
    console.log("[MetaArmy] Loading data for address:", address);
    
    // Load permission for this address
    const savedPermission = localStorage.getItem(`metaArmy_permission_${address}`);
    
    console.log("[MetaArmy] Found permission in localStorage:", savedPermission ? "YES" : "NO");
    
    if (savedPermission) {
      try {
        const parsed = JSON.parse(savedPermission);
        console.log("[MetaArmy] Parsed permission:", parsed);
        setPermission(parsed);
      } catch (e) {
        console.error("[MetaArmy] Failed to parse permission:", e);
      }
    } else {
      console.log("[MetaArmy] No saved permission, setting to null");
      setPermission(null);
    }
  }, [address]);

  const { connect, connectors } = useConnect();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  
  const { data: walletClient, error: walletError, isLoading: walletLoading, refetch: refetchWallet } = useWalletClient();

  // Fetch portfolio value for header
  useEffect(() => {
    async function fetchPortfolioValue() {
      if (!address || !publicClient) return;
      
      try {
        // Get ETH balance
        const ethBalance = await publicClient.getBalance({ address });
        const ethFormatted = parseFloat(formatEther(ethBalance));
        
        // Get USDC balance
        const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
        let usdcFormatted = 0;
        
        try {
          const usdcBalance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ],
            functionName: 'balanceOf',
            args: [address]
          });
          usdcFormatted = Number(usdcBalance) / 1e6;
        } catch (e) {
          console.log("USDC balance fetch failed for header");
        }
        
        // Calculate total USD value
        const ethValue = ethFormatted * 2000; // Rough ETH price
        const totalUsd = ethValue + usdcFormatted;
        setPortfolioValue(`$${totalUsd.toFixed(2)}`);
        
      } catch (error) {
        console.error("Failed to fetch portfolio value:", error);
      }
    }
    
    if (isConnected) {
      fetchPortfolioValue();
    }
  }, [address, publicClient, isConnected]);

  // Add log helper
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Log] ${timestamp} - ${message}`);
    setLogs(prev => [{ time: timestamp, message }, ...prev].slice(0, 10));
  }, []);

  // Handle chain mismatch - force switch to Sepolia
  const handleChainSwitch = useCallback(async () => {
    if (!isConnected || !switchChainAsync || switchingChain) return;
    
    if (walletError?.message?.includes("chain") || walletError?.message?.includes("Chain")) {
      console.log("[MetaArmy] Chain mismatch detected, requesting switch to Sepolia...");
      setSwitchingChain(true);
      
      try {
        await switchChainAsync({ chainId: SEPOLIA_CHAIN_ID });
        console.log("[MetaArmy] ✅ Chain switched to Sepolia!");
        setTimeout(() => {
          refetchWallet?.();
        }, 500);
      } catch (error) {
        console.error("[MetaArmy] Failed to switch chain:", error);
        alert("Please manually switch MetaMask Flask to Sepolia network!");
      } finally {
        setSwitchingChain(false);
      }
    }
  }, [isConnected, switchChainAsync, switchingChain, walletError, refetchWallet]);

  // Auto-switch chain when error detected
  useEffect(() => {
    if (walletError && isConnected) {
      handleChainSwitch();
    }
  }, [walletError, isConnected, handleChainSwitch]);

  // Auto-create session account when connected
  useEffect(() => {
    async function setup() {
      if (!isConnected || !publicClient || sessionAccount || !address) return;
      
      try {
        console.log("[MetaArmy] Creating session account for", address);
        addLog("🎫 Creating session account...");
        const sa = await createSessionAccount(publicClient, address);
        setSessionAccount(sa);
        
        console.log("[MetaArmy] Creating context...");
        addLog("🏗️ Setting up smart account context...");
        const context = await initSmartAccountContext(publicClient, address);
        setCtx(context);
        addLog("✅ Setup complete!");
      } catch (e: any) {
        console.error("[MetaArmy] Setup error:", e);
        addLog(`❌ Setup failed: ${e.message}`);
      }
    }
    
    setup();
  }, [isConnected, publicClient, sessionAccount, address, addLog]);

  async function handleConnect() {
    console.log("[MetaArmy] Connect button clicked");
    console.log("[MetaArmy] Available connectors:", connectors);
    
    const connector = connectors.find(c => c.name.toLowerCase().includes('metamask')) || connectors[0];
    if (connector) {
      console.log("[MetaArmy] Connecting with connector:", connector.name);
      try {
        await connect({ connector });
        console.log("[MetaArmy] Connection successful");
      } catch (error) {
        console.error("[MetaArmy] Connect error:", error);
        alert("Failed to connect wallet. Please make sure MetaMask is installed and try again.");
      }
    } else {
      console.error("[MetaArmy] No connectors available");
      alert("No wallet connectors available. Please install MetaMask and refresh the page.");
    }
  }

  async function handleGrantPermissions() {
    if (!sessionAccount) {
      alert("Session account not ready!");
      return;
    }
    
    if (!walletClient) {
      if (walletError) {
        await handleChainSwitch();
        return;
      }
      alert("Wallet client not ready!");
      return;
    }
    
    try {
      setLoading(true);
      addLog("📜 Requesting ERC-7715 permissions...");
      console.log("[MetaArmy] Granting permissions...");
      
      // Step 1: Grant ERC-7715 permissions
      const perm = await grantPermissions(sessionAccount, walletClient, chainId);
      setPermission(perm);
      
      console.log("[MetaArmy] Saving permission to localStorage:", `metaArmy_permission_${address}`);
      localStorage.setItem(`metaArmy_permission_${address}`, JSON.stringify(perm));
      
      addLog("✅ ERC-7715 permissions granted!");
      addLog("🎉 MetaArmy AI is ready for autonomous execution!");
      console.log("[MetaArmy] ✅ Setup complete!");
    } catch (error: any) {
      console.error("[MetaArmy] Setup error:", error);
      addLog(`❌ Setup failed: ${error.message}`);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestTransfer() {
    if (!permission || !ctx) {
      alert("ERC-7715 permissions not ready yet!");
      return;
    }

    try {
      setTransferring(true);
      addLog("🚀 Executing test ETH transfer via ERC-7715...");
      
      const result = await executeTransfer(ctx, permission.eth, {
        to: address, // Send to connected wallet
        amount: parseEther("0.001"), // 0.001 ETH
        token: "ETH"
      });

      addLog(`✅ ERC-7715 transfer complete! Tx: ${result.txHash.slice(0, 10)}...`);
      console.log("[MetaArmy] ✅ Transfer successful:", result.txHash);
      
      // Show success toast
      setShowToast({
        show: true,
        message: `✅ Test transfer successful! ${result.txHash.slice(0, 10)}...`,
        txHash: result.txHash
      });
      setTimeout(() => setShowToast({show: false, message: ''}), 5000);
    } catch (error: any) {
      console.error("[MetaArmy] Transfer error:", error);
      addLog(`❌ Transfer failed: ${error.message}`);
      alert(error.message);
    } finally {
      setTransferring(false);
    }
  }

  async function handleChatMessage() {
    if (!chatMessage.trim()) return;
    
    const userMessage = chatMessage.trim();
    const timestamp = new Date().toLocaleTimeString();
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { type: 'user', message: userMessage, timestamp }]);
    setChatMessage("");
    
    try {
      setAiProcessing(true);
      
      // Parse user intent using Gemini AI
      const intent = await parseUserIntent(userMessage);
      console.log("[AI] Parsed intent:", intent);
      
      if (intent.action === 'chat' || intent.action === 'help' || intent.action === 'portfolio') {
        // Handle non-financial commands
        const result = await executeAIIntent(intent, ctx, permission, address || "");
        
        setChatHistory(prev => [...prev, { 
          type: 'ai', 
          message: result.message, 
          timestamp: new Date().toLocaleTimeString() 
        }]);
      } else {
        // Handle financial commands
        addLog(`🤖 AI processing: ${intent.action} (confidence: ${Math.round(intent.confidence * 100)}%)`);
        
        const result = await executeAIIntent(intent, ctx, permission, address || "");
        
        setChatHistory(prev => [...prev, { 
          type: 'ai', 
          message: result.message, 
          timestamp: new Date().toLocaleTimeString() 
        }]);
        
        if (result.success && result.txHash) {
          addLog(`✅ AI executed transaction: ${result.txHash.slice(0, 10)}...`);
          
          console.log("[Toast] Showing success toast for tx:", result.txHash);
          // Show success toast
          setShowToast({
            show: true,
            message: `✅ Transaction successful! ${result.txHash.slice(0, 10)}...`,
            txHash: result.txHash
          });
          setTimeout(() => setShowToast({show: false, message: ''}), 8000); // Increased to 8 seconds
        } else if (!result.success) {
          addLog(`❌ AI execution failed: ${result.message}`);
        }
      }
    } catch (error: any) {
      console.error("[AI] Chat error:", error);
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        message: `❌ Error: ${error.message}`, 
        timestamp: new Date().toLocaleTimeString() 
      }]);
    } finally {
      setAiProcessing(false);
    }
  }

  const ready = isConnected && sessionAccount;
  const walletReady = !!walletClient;
  const hasChainError = walletError?.message?.includes("chain") || walletError?.message?.includes("Chain");

  // Navigation items - professional icons
  const navItems = [
    { id: 'chat', name: 'Swarm Chat', icon: MessageSquare },
    { id: 'dashboard', name: 'ArmyHub Overview', icon: Home },
    { id: 'portfolio', name: 'Portfolio Assets', icon: Briefcase },
    { id: 'activity', name: 'TX History', icon: History },
    { id: 'permissions', name: 'DAO Portal', icon: Shield },
    { id: 'settings', name: 'ZK Security', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex overflow-hidden">
      {/* Only show sidebar when wallet is connected - Fixed Position */}
      {isConnected && (
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col flex-shrink-0`}>
          {/* Logo */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white">MetaArmy</h1>
                  <p className="text-sm text-orange-400">3.0</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-orange-500/20 text-orange-400 border-r-2 border-orange-500'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {sidebarOpen && <span className="ml-3 font-medium">{item.name}</span>}
                </button>
              ))}
            </div>
          </nav>

          {/* Disconnect Button */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={() => {
                connector?.disconnect?.();
                // Clear all stored data
                if (address) {
                  localStorage.removeItem(`metaArmy_permission_${address}`);
                }
                // Reset state
                setPermission(null);
                setSessionAccount(null);
                setCtx(null);
                setChatHistory([]);
                setLogs([]);
                // Force page reload to ensure clean state
                setTimeout(() => window.location.reload(), 100);
              }}
              className="w-full flex items-center px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3 font-medium">Disconnect</span>}
            </button>
          </div>

          {/* Sidebar Toggle */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center px-3 py-2 text-slate-400 hover:bg-slate-700 rounded-lg"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Flexible with proper height */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Only show header when wallet is connected - Fixed */}
        {isConnected && (
          <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {navItems.find(item => item.id === activeTab)?.name}
                </h2>
                <p className="text-slate-400">
                  {activeTab === 'dashboard' && 'Manage your DeFi operations'}
                  {activeTab === 'chat' && 'Chat with your AI assistant'}
                  {activeTab === 'portfolio' && 'View your portfolio performance'}
                  {activeTab === 'permissions' && 'Manage ERC-7715 permissions'}
                  {activeTab === 'activity' && 'View recent transactions'}
                  {activeTab === 'settings' && 'Configure your preferences'}
                </p>
              </div>
              
              {/* Portfolio Value & Wallet Info */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-400">PORTFOLIO VALUE</p>
                  <p className="text-xl font-bold text-white">{portfolioValue}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-300">{connector?.name}</span>
                </div>
                <div className="px-3 py-2 bg-orange-500/20 rounded-lg">
                  <span className="text-sm font-mono text-orange-400">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Content Area - Scrollable */}
        <main className="flex-1 bg-slate-900 overflow-hidden">
          {!isConnected ? (
            <WelcomeScreen onConnect={handleConnect} />
          ) : !ready ? (
            <LoadingScreen />
          ) : (
            <div className="h-full overflow-hidden">
              {activeTab === 'dashboard' && <DashboardTab 
                permission={permission}
                loading={loading}
                transferring={transferring}
                walletReady={walletReady}
                hasChainError={hasChainError}
                switchingChain={switchingChain}
                onGrantPermissions={handleGrantPermissions}
                onTestTransfer={handleTestTransfer}
                onChainSwitch={handleChainSwitch}
                onReset={() => {
                  if (confirm("Reset all data? You'll need to setup again.")) {
                    localStorage.removeItem(`metaArmy_permission_${address}`);
                    setPermission(null);
                    addLog("🔄 All data reset");
                  }
                }}
                chainId={chainId}
                sessionAccount={sessionAccount}
                address={address}
              />}
              {activeTab === 'chat' && <ChatTab 
                chatHistory={chatHistory}
                chatMessage={chatMessage}
                setChatMessage={setChatMessage}
                onSendMessage={handleChatMessage}
                ready={ready}
              />}
              {activeTab === 'portfolio' && <PortfolioTab />}
              {activeTab === 'permissions' && <PermissionsTab 
                permission={permission}
                address={address}
              />}
              {activeTab === 'activity' && <ActivityTab logs={logs} />}
              {activeTab === 'settings' && <SettingsTab />}
            </div>
          )}
        </main>
      </div>

      {/* Success Toast Notification */}
      {showToast.show && (
        <div className="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 border border-green-400 animate-in slide-in-from-right-5 duration-300">
          <CheckCircle className="w-6 h-6 text-green-100" />
          <div className="flex-1">
            <span className="font-semibold text-sm">{showToast.message}</span>
          </div>
          {showToast.txHash && (
            <button
              onClick={() => {
                window.open(`https://sepolia.etherscan.io/tx/${showToast.txHash}`, '_blank');
                console.log("[Toast] Opening Etherscan for tx:", showToast.txHash);
              }}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold transition-colors flex items-center gap-1 border border-green-500"
            >
              View on Etherscan <ExternalLink className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => {
              console.log("[Toast] Closing toast");
              setShowToast({show: false, message: ''});
            }}
            className="text-green-200 hover:text-white text-lg font-bold leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// Welcome Screen Component - Professional Landing Page (Based on Previous Design)
function WelcomeScreen({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="bg-gray-50 overflow-x-hidden">
      {/* Sticky Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[200] px-6 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-3 glass px-5 py-3 rounded-2xl border-white/40 shadow-xl shadow-black/5">
            <img src="/logo.png" alt="MetaArmy Logo" className="w-8 h-8 object-contain" />
            <span className="text-sm font-black tracking-tight">MetaArmy <span className="text-orange-500">3.0</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 glass px-8 py-3 rounded-2xl border-white/40 shadow-xl shadow-black/5">
            {['Swarm', 'Security', 'FAQ', 'Docs'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors">{item}</a>
            ))}
          </div>

          <button
            onClick={onConnect}
            className="glass px-6 py-3 rounded-2xl border-white/40 shadow-xl shadow-black/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-900 hover:text-white transition-all active:scale-95"
          >
            Launch App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 px-4">
        <div className="absolute top-0 inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-500/5 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[150px] rounded-full"></div>
        </div>

        <div className="mb-12 animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="px-5 py-2 glass rounded-full flex items-center gap-3 shadow-2xl shadow-orange-100/20 border-white/50">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
            <span className="text-[9px] font-black text-gray-900 uppercase tracking-[0.4em]">v3.0 The Verifiable Swarm is Live</span>
          </div>
        </div>

        <div className="text-center max-w-5xl mx-auto space-y-10 mb-16 relative">
          <h1 className="text-7xl md:text-[9.5rem] font-black text-gray-900 tracking-tight leading-[0.85] select-none">
            Command the Swarm Economy
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
            The first AI-Agentic Swarm for Web3. Deploy 1,000 sub-agents to execute your complex DeFi intents with ZK-Turbo security.
          </p>
        </div>

        <div className="flex flex-col items-center gap-10">
          <button
            onClick={onConnect}
            className="group relative px-12 py-7 bg-gray-900 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.2em] hover:bg-orange-600 transition-all hover:scale-105 shadow-2xl shadow-gray-400/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 opacity-0 group-hover:opacity-30 transition-opacity"></div>
            <span className="relative flex items-center gap-4">
              Initialize Swarm 
              <svg className="w-7 h-7 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          <div className="flex items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            <span className="text-xs font-black uppercase tracking-[0.3em]">Audited by Zellic</span>
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-xs font-black uppercase tracking-[0.3em]">Built for MetaMask v3</span>
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-xs font-black uppercase tracking-[0.3em]">ZK Powered</span>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-32 w-full max-w-7xl px-4 perspective-1000">
          <div className="relative transform hover:scale-105 transition-transform duration-1000 ease-out shadow-[-50px_100px_100px_-50px_rgba(0,0,0,0.1),50px_100px_100px_-50px_rgba(0,0,0,0.1)] rounded-[4rem] overflow-hidden">
            <img src="/assets/swarm_4k.png" alt="Swarm Visualization" className="w-full h-[600px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
            <div className="absolute bottom-20 left-20 right-20 flex justify-between items-end">
              <div className="space-y-4">
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-[0.3em]">Live Swarm Data</p>
                <h2 className="text-4xl font-black text-white">42,901 Active Sub-Agents</h2>
              </div>
              <div className="p-8 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                  <span className="text-xs font-black text-white uppercase">$14.2M BATCHED TX VOL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-20 hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900">Scroll</span>
          <div className="w-px h-12 bg-gray-900"></div>
        </div>
      </section>

      {/* Feature Walkthrough */}
      <section id="swarm" className="py-40 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-10">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-6xl font-black text-gray-900 tracking-tight leading-none">
              The Swarm Orchestrator
            </h2>
            <p className="text-xl text-gray-500 font-medium leading-relaxed">
              MetaArmy 3.0 doesn't just automate; it orchestrates. Our "Swarm Engine" breaks your high-level intent into hundreds of secure sub-tasks, executing them across chains simultaneously to capture every millisecond of alpha.
            </p>
            <ul className="space-y-6">
              {[
                { icon: '⚡', text: 'Massive Gas Batching (-92% fees)' },
                { icon: '🌐', text: 'Cross-Chain Liquidity Routing' },
                { icon: '👥', text: 'Community-Owned Agent Logic' }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-500/20 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
            <img src="/assets/brain_4k.png" alt="Swarm Brain" className="relative w-full rounded-[4rem] shadow-2xl animate-float" />
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-40 bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-orange-500/5 blur-[150px]"></div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="order-2 lg:order-1 relative group">
            <div className="absolute inset-0 bg-green-500/10 blur-[100px] rounded-full"></div>
            <img src="/assets/vault_4k.png" alt="ZK Vault" className="relative w-full rounded-[4rem] shadow-2xl border border-white/10" />
          </div>
          <div className="order-1 lg:order-2 space-y-10">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10">
              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">ZK-Turbo Architecture</span>
            </div>
            <h2 className="text-6xl font-black text-white tracking-tight leading-none">
              Mathematically Verifiable Wealth
            </h2>
            <p className="text-xl text-white/40 font-medium leading-relaxed">
              Every swarm execution is bundled with a Brevis ZK-proof. No trust required. Your agents can only execute exactly what you've permitted, verified on-chain at every step.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                <p className="text-4xl font-black text-white mb-2">99.9%</p>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Trust Integrity</p>
              </div>
              <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                <p className="text-4xl font-black text-white mb-2">0</p>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Exploits Since Launch</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-60 px-4 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[150px] -z-10"></div>
        <h2 className="text-8xl font-black text-gray-900 mb-12 tracking-tighter">Your Army Awaits.</h2>
        <button
          onClick={onConnect}
          className="px-20 py-10 bg-gray-900 text-white rounded-[3rem] font-black text-2xl uppercase tracking-[0.3em] hover:bg-orange-600 transition-all hover:scale-110 shadow-3xl shadow-orange-200"
        >
          Connect Wallet
        </button>
        <div className="mt-20 flex justify-center gap-12 opacity-30 grayscale items-center">
          {['UNISWAP', 'AAVE', 'LIDO', 'ENVIO', 'BREVIS', 'METAMASK'].map(n => (
            <span key={n} className="text-sm font-black uppercase tracking-[0.5em]">{n}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="MetaArmy Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-black">MetaArmy <span className="text-orange-500">3.0</span></span>
          </div>
          <div className="flex gap-10 text-xs font-black text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-gray-900 transition-colors">Documentation</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Governance</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Twitter (X)</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Discord</a>
          </div>
          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">© 2025 Meta-Pilot Labs. Built for The Swarm.</p>
        </div>
      </footer>
    </div>
  );
}

// Loading Screen Component
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full bg-slate-900">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Setting up your account</h2>
        <p className="text-slate-400">Creating session account and initializing smart contracts...</p>
      </div>
    </div>
  );
}

export default function Page() {
  return <HomePage />;
}

// Dashboard Tab Component
function DashboardTab({ 
  permission, 
  loading, 
  transferring, 
  walletReady, 
  hasChainError, 
  switchingChain, 
  onGrantPermissions, 
  onTestTransfer, 
  onChainSwitch, 
  onReset,
  chainId,
  sessionAccount,
  address 
}: any) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-3">
            <StatusItem 
              label="Connected Wallet" 
              value={address?.slice(0, 10) + '...'} 
              status="success" 
            />
            <StatusItem 
              label="Session Account" 
              value={sessionAccount?.address?.slice(0, 10) + '...'} 
              status="success" 
            />
            <StatusItem 
              label="Network" 
              value={chainId === SEPOLIA_CHAIN_ID ? "Sepolia ✅" : `${chainId} ❌`} 
              status={chainId === SEPOLIA_CHAIN_ID ? "success" : "error"} 
            />
            <StatusItem 
              label="Wallet Client" 
              value={walletReady ? "Ready" : hasChainError ? "Wrong Network" : "Not Ready"} 
              status={walletReady ? "success" : "warning"} 
            />
            <StatusItem 
              label="ERC-7715 Permissions" 
              value={permission ? "Granted" : "Not Granted"} 
              status={permission ? "success" : "pending"} 
            />
            <StatusItem 
              label="AI Assistant" 
              value={permission ? "Ready" : "Setup Required"} 
              status={permission ? "success" : "pending"} 
            />
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {hasChainError && (
              <button
                onClick={onChainSwitch}
                disabled={switchingChain}
                className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {switchingChain ? "Switching..." : "Switch to Sepolia"}
              </button>
            )}

            {!permission ? (
              <button
                onClick={onGrantPermissions}
                disabled={loading || !walletReady}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? "Setting up..." : "Setup ERC-7715 Permissions"}
              </button>
            ) : (
              <button
                onClick={onTestTransfer}
                disabled={transferring}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {transferring ? "Processing..." : "Test Transfer (0.001 ETH)"}
              </button>
            )}

            {permission && (
              <button
                onClick={onReset}
                className="w-full px-4 py-2 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg font-medium"
              >
                Reset All Data
              </button>
            )}
          </div>
        </div>

        {/* ERC-7715 Info */}
        <div className="lg:col-span-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30 p-6">
          <h3 className="text-lg font-semibold text-white mb-2">ERC-7715 Advanced Permissions</h3>
          <p className="text-slate-400 mb-4">
            Using MetaMask's native ERC-7715 implementation for secure, delegated execution without custom contracts.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono bg-slate-800 text-orange-400 px-3 py-1 rounded border border-slate-700">
              Native MetaMask Integration
            </span>
            <a 
              href="https://eips.ethereum.org/EIPS/eip-7715"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 text-sm font-medium flex items-center gap-1"
            >
              Learn about ERC-7715
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat Tab Component
function ChatTab({ chatHistory, chatMessage, setChatMessage, onSendMessage, ready }: any) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header - Fixed */}
      <div className="flex-shrink-0 p-6 pb-0">
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Swarm Orchestrator v3</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-400 font-medium">AUTONOMOUS GRID ACTIVE</span>
            </div>
          </div>
          <div className="px-3 py-1 bg-blue-500/20 rounded-lg">
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">ZK-BATCHED</span>
          </div>
        </div>
      </div>

      {/* Chat Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="max-w-4xl mx-auto">
          {chatHistory.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white mb-4">
                    Hello! I'm MetaArmy AI, your DeFi automation assistant. I can help you understand 
                    protocols, set up automated strategies, or answer questions about yield farming.
                  </p>
                  <p className="text-slate-400 text-sm mb-4">
                    Try asking me something like "What is Aave?" or "Help me invest 100 USDC in DeFi" 
                    to get started!
                  </p>
                  <div className="text-xs text-slate-500">
                    10:15 AM
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {chatHistory.map((chat: any, i: number) => (
                <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      chat.type === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-orange-500'
                    }`}>
                      <span className="text-white text-sm">
                        {chat.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white">{chat.message}</p>
                      <div className="text-xs text-slate-500 mt-2">{chat.timestamp}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <div className="flex-shrink-0 p-6 pt-0">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex gap-3">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                placeholder={ready ? "Ask me anything about DeFi or describe what you want to automate..." : "Connect wallet first..."}
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={!ready}
              />
              <button
                onClick={onSendMessage}
                disabled={!ready || !chatMessage.trim()}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
            
            {/* Quick Test Buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setChatMessage("hi");
                  setTimeout(() => onSendMessage(), 100);
                }}
                disabled={!ready}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm disabled:opacity-50"
              >
                Test: Hi
              </button>
              <button
                onClick={() => {
                  setChatMessage("help");
                  setTimeout(() => onSendMessage(), 100);
                }}
                disabled={!ready}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm disabled:opacity-50"
              >
                Test: Help
              </button>
              <button
                onClick={() => {
                  setChatMessage("invest 0.001 ETH");
                  setTimeout(() => onSendMessage(), 100);
                }}
                disabled={!ready}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm disabled:opacity-50"
              >
                Test: Invest
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-3 text-xs">
              <div className="flex items-center gap-4 text-slate-500">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">⌘</kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">K</kbd>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">ENTER</kbd>
                  <span>TO SEND</span>
                </span>
              </div>
              {!ready && (
                <span className="text-slate-400">Connect your wallet and setup permissions to use the AI assistant</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Portfolio Tab Component
function PortfolioTab() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [balances, setBalances] = useState<any>({
    eth: '0',
    usdc: '0',
    totalUsd: '0',
    loading: true
  });

  // Fetch real balances
  useEffect(() => {
    async function fetchBalances() {
      if (!address || !publicClient) return;
      
      try {
        setBalances((prev: any) => ({ ...prev, loading: true }));
        
        // Get ETH balance
        const ethBalance = await publicClient.getBalance({ address });
        const ethFormatted = parseFloat(formatEther(ethBalance)).toFixed(4);
        
        // Get USDC balance (ERC-20)
        const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
        let usdcFormatted = '0';
        
        try {
          const usdcBalance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ],
            functionName: 'balanceOf',
            args: [address]
          });
          usdcFormatted = (Number(usdcBalance) / 1e6).toFixed(2); // USDC has 6 decimals
        } catch (e) {
          console.log("USDC balance fetch failed:", e);
        }
        
        // Calculate total USD value (rough estimate: ETH = $2000)
        const ethValue = parseFloat(ethFormatted) * 2000;
        const usdcValue = parseFloat(usdcFormatted);
        const totalUsd = (ethValue + usdcValue).toFixed(2);
        
        setBalances({
          eth: ethFormatted,
          usdc: usdcFormatted,
          totalUsd,
          loading: false
        });
        
      } catch (error) {
        console.error("Failed to fetch balances:", error);
        setBalances((prev: any) => ({ ...prev, loading: false }));
      }
    }
    
    fetchBalances();
  }, [address, publicClient]);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Overview */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Overview</h3>
          
          {balances.loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading your portfolio...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Token List */}
              <div className="space-y-3">
                {/* ETH */}
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">ETH</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Ethereum</h4>
                      <p className="text-sm text-slate-400">Sepolia Testnet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{balances.eth} ETH</p>
                    <p className="text-sm text-slate-400">${(parseFloat(balances.eth) * 2000).toFixed(2)}</p>
                  </div>
                </div>

                {/* USDC */}
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">USDC</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">USD Coin</h4>
                      <p className="text-sm text-slate-400">Sepolia Testnet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{balances.usdc} USDC</p>
                    <p className="text-sm text-slate-400">${balances.usdc}</p>
                  </div>
                </div>
              </div>

              {/* Portfolio Chart Placeholder */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h4 className="text-white font-medium mb-4">Portfolio Performance</h4>
                <div className="h-32 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-slate-400" />
                  <span className="ml-2 text-slate-400">Chart coming soon</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h4 className="font-medium text-white mb-2">Total Value</h4>
            <p className="text-2xl font-bold text-white">
              {balances.loading ? '...' : `$${balances.totalUsd}`}
            </p>
            <p className="text-sm text-slate-400">+0.00% (24h)</p>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h4 className="font-medium text-white mb-2">Active Positions</h4>
            <p className="text-2xl font-bold text-white">
              {balances.loading ? '...' : (parseFloat(balances.eth) > 0 || parseFloat(balances.usdc) > 0 ? '2' : '0')}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h4 className="font-medium text-white mb-2">Total Yield</h4>
            <p className="text-2xl font-bold text-white">$0.00</p>
            <p className="text-sm text-slate-400">0.00% APY</p>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Refresh Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}

// Permissions Tab Component
function PermissionsTab({ permission, address }: any) {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ERC-7715 Permissions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">ERC-7715 Permissions</h3>
          {permission ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h4 className="font-medium text-green-400">Permissions Granted</h4>
                  <p className="text-sm text-green-300">Your AI assistant has been granted ERC-7715 permissions</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-600 rounded-lg bg-slate-700">
                  <h5 className="font-medium text-white mb-2">ETH Permission</h5>
                  <p className="text-sm text-slate-400">0.1 ETH per hour</p>
                </div>
                <div className="p-4 border border-slate-600 rounded-lg bg-slate-700">
                  <h5 className="font-medium text-white mb-2">USDC Permission</h5>
                  <p className="text-sm text-slate-400">10 USDC per hour</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-slate-400 mb-4 mx-auto" />
              <h4 className="text-lg font-semibold text-white mb-2">No Permissions Granted</h4>
              <p className="text-slate-400">Grant ERC-7715 permissions to enable AI automation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Activity Tab Component
function ActivityTab({ logs }: any) {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-400 mb-4 mx-auto" />
              <h4 className="text-lg font-semibold text-white mb-2">No Activity Yet</h4>
              <p className="text-slate-400">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-slate-600 rounded-lg bg-slate-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{log.message}</p>
                    <p className="text-xs text-slate-400">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  const [settings, setSettings] = useState({
    aiEnabled: true,
    autoExecute: false,
    gasLimit: 'medium',
    slippageTolerance: '0.5',
    notifications: true,
    darkMode: true,
    riskLevel: 'medium',
    maxTransactionAmount: '0.1'
  });

  const [saved, setSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('metaArmy_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('metaArmy_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default values?')) {
      const defaultSettings = {
        aiEnabled: true,
        autoExecute: false,
        gasLimit: 'medium',
        slippageTolerance: '0.5',
        notifications: true,
        darkMode: true,
        riskLevel: 'medium',
        maxTransactionAmount: '0.1'
      };
      setSettings(defaultSettings);
      localStorage.setItem('metaArmy_settings', JSON.stringify(defaultSettings));
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* AI Assistant Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-6 h-6 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">AI Assistant Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Enable AI Assistant</h4>
                <p className="text-sm text-slate-400">Allow AI to analyze and execute DeFi operations</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, aiEnabled: !prev.aiEnabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.aiEnabled ? 'bg-orange-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.aiEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Auto-Execute Transactions</h4>
                <p className="text-sm text-slate-400">Automatically execute approved transactions without confirmation</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, autoExecute: !prev.autoExecute }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoExecute ? 'bg-orange-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoExecute ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">Risk Level</h4>
              <select
                value={settings.riskLevel}
                onChange={(e) => setSettings(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="low">Conservative - Low risk, stable returns</option>
                <option value="medium">Balanced - Moderate risk and returns</option>
                <option value="high">Aggressive - High risk, high potential returns</option>
              </select>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">Max Transaction Amount (ETH)</h4>
              <input
                type="number"
                step="0.01"
                value={settings.maxTransactionAmount}
                onChange={(e) => setSettings(prev => ({ ...prev, maxTransactionAmount: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                placeholder="0.1"
              />
              <p className="text-xs text-slate-400 mt-1">Maximum amount per transaction for AI execution</p>
            </div>
          </div>
        </div>

        {/* Transaction Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Transaction Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-white mb-2">Gas Limit Preference</h4>
              <select
                value={settings.gasLimit}
                onChange={(e) => setSettings(prev => ({ ...prev, gasLimit: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low - Slower but cheaper</option>
                <option value="medium">Medium - Balanced speed and cost</option>
                <option value="high">High - Faster but more expensive</option>
              </select>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">Slippage Tolerance (%)</h4>
              <select
                value={settings.slippageTolerance}
                onChange={(e) => setSettings(prev => ({ ...prev, slippageTolerance: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="0.1">0.1% - Very low slippage</option>
                <option value="0.5">0.5% - Low slippage</option>
                <option value="1.0">1.0% - Medium slippage</option>
                <option value="3.0">3.0% - High slippage</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Enable Notifications</h4>
                <p className="text-sm text-slate-400">Get notified about transaction status and opportunities</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications ? 'bg-yellow-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Security & Privacy</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="font-medium text-green-400">ERC-7715 Security Active</h4>
              </div>
              <p className="text-sm text-green-300">
                Your transactions are protected by ERC-7715 advanced permissions. 
                The AI can only execute within your predefined limits.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-700 rounded-lg">
                <h5 className="font-medium text-white text-sm">Session Expiry</h5>
                <p className="text-xs text-slate-400">30 days</p>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg">
                <h5 className="font-medium text-white text-sm">Permission Limits</h5>
                <p className="text-xs text-slate-400">0.1 ETH/hour</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {saved ? 'Settings Saved!' : 'Save Settings'}
          </button>
          
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
          >
            Reset to Default
          </button>
        </div>

        {/* Debug Info */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Debug Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-white mb-1">Network</h5>
              <p className="text-slate-400">Sepolia Testnet</p>
            </div>
            <div>
              <h5 className="font-medium text-white mb-1">MetaArmy Version</h5>
              <p className="text-slate-400">v3.0.0</p>
            </div>
            <div>
              <h5 className="font-medium text-white mb-1">ERC-7715 Status</h5>
              <p className="text-green-400">Active</p>
            </div>
            <div>
              <h5 className="font-medium text-white mb-1">AI Model</h5>
              <p className="text-slate-400">Gemini Pro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Status Item Component
function StatusItem({ label, value, status }: { label: string, value: string, status: 'success' | 'error' | 'warning' | 'pending' }) {
  const statusColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-orange-400',
    pending: 'text-slate-400'
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-400">{label}:</span>
      <span className={`text-sm font-medium ${statusColors[status]}`}>{value}</span>
    </div>
  );
}