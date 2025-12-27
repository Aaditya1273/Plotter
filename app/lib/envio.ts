// Envio GraphQL client for real-time blockchain data
import { GraphQLClient } from 'graphql-request'

const ENVIO_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_ENDPOINT || 'https://indexer.bigdevenergy.link/your-indexer/v1/graphql'

export const envioClient = new GraphQLClient(ENVIO_ENDPOINT)

// TypeScript interfaces for Envio data
interface Activity {
  id: string
  type: string
  description: string
  amount: string
  timestamp: string
  txHash: string
  status: string
}

interface Permission {
  id: string
  target: string
  amount: string
  frequency: string
  conditions: string[]
  status: string
  created: string
  lastExecution?: string
  totalExecuted: number
}

interface PortfolioSnapshot {
  timestamp: string
  totalValue: string
  yieldEarned: string
}

interface YieldPool {
  id: string
  protocol: string
  asset: string
  apy: number
  tvl: string
  riskScore: number
}

// Response types
interface ActivitiesResponse {
  activities: Activity[]
}

interface PermissionsResponse {
  permissions: Permission[]
}

interface PortfolioResponse {
  portfolioSnapshots: PortfolioSnapshot[]
}

interface YieldResponse {
  yieldPools: YieldPool[]
}
export const GET_USER_ACTIVITIES = `
  query GetUserActivities($userAddress: String!) {
    activities(
      where: { user: { _eq: $userAddress } }
      order_by: { timestamp: desc }
      limit: 50
    ) {
      id
      type
      description
      amount
      timestamp
      txHash
      status
    }
  }
`

export const GET_PERMISSIONS = `
  query GetPermissions($userAddress: String!) {
    permissions(
      where: { user: { _eq: $userAddress } }
      order_by: { created: desc }
    ) {
      id
      target
      amount
      frequency
      conditions
      status
      created
      lastExecution
      totalExecuted
    }
  }
`

export const GET_PORTFOLIO_VALUE = `
  query GetPortfolioValue($userAddress: String!) {
    portfolioSnapshots(
      where: { user: { _eq: $userAddress } }
      order_by: { timestamp: desc }
      limit: 30
    ) {
      timestamp
      totalValue
      yieldEarned
    }
  }
`

export const GET_YIELD_OPPORTUNITIES = `
  query GetYieldOpportunities {
    yieldPools(
      order_by: { apy: desc }
      limit: 10
    ) {
      id
      protocol
      asset
      apy
      tvl
      riskScore
    }
  }
`

// Helper functions for data fetching
export async function fetchUserActivities(userAddress: string): Promise<Activity[]> {
  try {
    const data = await envioClient.request(GET_USER_ACTIVITIES, { userAddress }) as ActivitiesResponse
    return data.activities || []
  } catch (error) {
    console.error('Error fetching user activities:', error)
    return []
  }
}

export async function fetchUserPermissions(userAddress: string): Promise<Permission[]> {
  try {
    const data = await envioClient.request(GET_PERMISSIONS, { userAddress }) as PermissionsResponse
    return data.permissions || []
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return []
  }
}

export async function fetchPortfolioValue(userAddress: string): Promise<PortfolioSnapshot[]> {
  try {
    const data = await envioClient.request(GET_PORTFOLIO_VALUE, { userAddress }) as PortfolioResponse
    return data.portfolioSnapshots || []
  } catch (error) {
    console.error('Error fetching portfolio value:', error)
    return []
  }
}

export async function fetchYieldOpportunities(): Promise<YieldPool[]> {
  try {
    const data = await envioClient.request(GET_YIELD_OPPORTUNITIES) as YieldResponse
    return data.yieldPools || []
  } catch (error) {
    console.error('Error fetching yield opportunities:', error)
    return []
  }
}