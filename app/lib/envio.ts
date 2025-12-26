// Envio GraphQL client for real-time blockchain data
import { GraphQLClient } from 'graphql-request'

const ENVIO_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_ENDPOINT || 'https://indexer.bigdevenergy.link/your-indexer/v1/graphql'

export const envioClient = new GraphQLClient(ENVIO_ENDPOINT)

// GraphQL queries for Meta-Plot AI data
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
export async function fetchUserActivities(userAddress: string) {
  try {
    const data = await envioClient.request(GET_USER_ACTIVITIES, { userAddress })
    return data.activities || []
  } catch (error) {
    console.error('Error fetching user activities:', error)
    return []
  }
}

export async function fetchUserPermissions(userAddress: string) {
  try {
    const data = await envioClient.request(GET_PERMISSIONS, { userAddress })
    return data.permissions || []
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return []
  }
}

export async function fetchPortfolioValue(userAddress: string) {
  try {
    const data = await envioClient.request(GET_PORTFOLIO_VALUE, { userAddress })
    return data.portfolioSnapshots || []
  } catch (error) {
    console.error('Error fetching portfolio value:', error)
    return []
  }
}

export async function fetchYieldOpportunities() {
  try {
    const data = await envioClient.request(GET_YIELD_OPPORTUNITIES)
    return data.yieldPools || []
  } catch (error) {
    console.error('Error fetching yield opportunities:', error)
    return []
  }
}