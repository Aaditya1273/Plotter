// Contract addresses and constants for Meta-Plot AI

export const CONTRACTS = {
  // MetaArmySimple deployed contract address on Sepolia (ERC-7715 compatible)
  META_ARMY: '0xBa8B2a116cbb0240Be18Ad7E4989CffC445Ee6d9',
  META_ARMY_SIMPLE: '0xBa8B2a116cbb0240Be18Ad7E4989CffC445Ee6d9',
  ARMY_TOKEN: '0x35d55c205Ff2b5c943c5BBA88C5E0CAeC1d3648F',

  // Real Sepolia testnet addresses (ERC-7715 compatible)
  AAVE_POOL: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951', // Aave V3 Pool on Sepolia
  AAVE_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654', // Aave V3 Data Provider
  USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC on Sepolia (ERC-7715 compatible)
  DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', // DAI on Sepolia
  WETH: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c', // WETH on Sepolia
} as const

export const SUPPORTED_ASSETS = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: CONTRACTS.USDC,
    decimals: 6,
    icon: '💵'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    icon: '⟠'
  }
] as const

export const SUPPORTED_PROTOCOLS = [
  {
    name: 'Aave',
    description: 'Leading lending and borrowing protocol',
    address: CONTRACTS.AAVE_POOL,
    icon: '🏦',
    riskLevel: 'low' as const,
    features: ['Lending', 'Borrowing', 'Yield Farming']
  },
  {
    name: 'Compound',
    description: 'Algorithmic money markets',
    address: '0x0000000000000000000000000000000000000000', // Placeholder
    icon: '🏛️',
    riskLevel: 'low' as const,
    features: ['Lending', 'Borrowing']
  }
] as const

export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', seconds: 86400 },
  { value: 'weekly', label: 'Weekly', seconds: 604800 },
  { value: 'monthly', label: 'Monthly', seconds: 2592000 }
] as const

export const GAS_THRESHOLDS = {
  LOW: 20,
  MEDIUM: 30,
  HIGH: 50
} as const

export const APY_THRESHOLDS = {
  MIN: 3,
  GOOD: 5,
  EXCELLENT: 8
} as const

export const RISK_LEVELS = {
  LOW: { label: 'Conservative', color: 'green', maxAllocation: 0.8 },
  MEDIUM: { label: 'Balanced', color: 'yellow', maxAllocation: 0.9 },
  HIGH: { label: 'Aggressive', color: 'red', maxAllocation: 1.0 }
} as const

// Chain configuration
export const CHAIN_CONFIG = {
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
} as const

// Intent parsing patterns
export const INTENT_PATTERNS = {
  ACTIONS: {
    invest: ['invest', 'put', 'deposit', 'stake'],
    swap: ['swap', 'exchange', 'trade', 'convert'],
    yield: ['yield', 'earn', 'farm', 'generate'],
    rebalance: ['rebalance', 'adjust', 'optimize'],
    dca: ['dca', 'dollar cost average', 'regular']
  },
  ASSETS: {
    USDC: ['usdc', 'usd coin', 'dollar'],
    ETH: ['eth', 'ethereum', 'ether'],
    DAI: ['dai'],
    USDT: ['usdt', 'tether']
  },
  PROTOCOLS: {
    Aave: ['aave'],
    Compound: ['compound'],
    Uniswap: ['uniswap', 'uni'],
    Curve: ['curve']
  },
  FREQUENCIES: {
    daily: ['daily', 'every day', 'each day'],
    weekly: ['weekly', 'every week', 'each week'],
    monthly: ['monthly', 'every month', 'each month']
  }
} as const

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this operation',
  INVALID_AMOUNT: 'Please enter a valid amount',
  PERMISSION_DENIED: 'Permission denied by user',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  CONTRACT_ERROR: 'Smart contract error. Please contact support.'
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  PERMISSION_GRANTED: 'Permission granted successfully! Your agent is now active.',
  PERMISSION_REVOKED: 'Permission revoked successfully.',
  TRANSACTION_SUCCESS: 'Transaction completed successfully!',
  AGENT_ACTIVATED: 'AI agent activated and monitoring conditions.'
} as const