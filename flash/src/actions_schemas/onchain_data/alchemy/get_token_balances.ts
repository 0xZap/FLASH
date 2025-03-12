import { z } from "zod";

export const GET_TOKEN_BALANCES_ACTION_NAME = "get_token_balances";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy token balances tool inputs
 */
export const TokenBalancesSchema = z.object({
    address: z.string().describe("The wallet address to fetch token balances for"),
    tokenAddresses: z.array(z.string()).optional().describe("Optional array of token contract addresses to check balances for. If empty, will fetch all token balances."),
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
  export const TOKEN_BALANCES_PROMPT = `
  This tool fetches token balances for a specific wallet address using the Alchemy API.
  
  Required inputs:
  - address: The wallet address to fetch token balances for
  
  Optional inputs:
  - tokenAddresses: Array of token contract addresses to check balances for
    If not provided, will fetch all token balances for the wallet
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, etc.
  
  Examples:
  - All token balances: { "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" }
  - Specific token balance: {
      "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "tokenAddresses": ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"]
    }
  - On Polygon network: {
      "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "network": "MATIC_MAINNET"
    }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Returns token balances with metadata such as name, symbol, and decimals
  - Zero balances may be included in results
  `;
  