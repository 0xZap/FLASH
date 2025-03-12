import { z } from "zod";

export const GET_TRANSACTIONS_BY_ADDRESS_ACTION_NAME = "get_transactions_by_address";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy transactions by address tool inputs
 */
export const TransactionsByAddressSchema = z.object({
    address: z.string().describe("The address to fetch transactions for (e.g., '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')"),
    networks: z.array(z.string()).default(["ETH_MAINNET"]).describe("Array of networks to search on (e.g., ['ETH_MAINNET', 'MATIC_MAINNET'])"),
    limit: z.number().optional().default(10).describe("Maximum number of transactions to return"),
    pageKey: z.string().optional().describe("Page key for pagination"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const TRANSACTIONS_BY_ADDRESS_PROMPT = `
  This tool fetches transactions for a specific address using the Alchemy API.
  
  Required inputs:
  - address: The wallet or contract address to fetch transactions for
  
  Optional inputs:
  - networks: Array of networks to search on (default: ["ETH_MAINNET"])
    Available networks: ETH_MAINNET, ETH_GOERLI, ETH_SEPOLIA, MATIC_MAINNET, MATIC_MUMBAI, etc.
  - limit: Maximum number of transactions to return (default: 10)
  - pageKey: Page key for pagination (for fetching next set of results)
  
  Examples:
  - Basic query: { "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" }
  - Multi-network: { "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "networks": ["ETH_MAINNET", "MATIC_MAINNET"] }
  - With limit: { "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "limit": 5 }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Returns information about token transfers, contract interactions, and native transactions
  - Large addresses may have many transactions; use limit and pagination to manage response size
  `;