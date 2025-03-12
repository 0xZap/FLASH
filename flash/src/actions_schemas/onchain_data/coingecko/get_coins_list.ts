import { z } from "zod";

export const GET_COINS_LIST_ACTION_NAME = "get_coins_list";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the CoinGecko coins list tool inputs
 */
export const CoinsListSchema = z.object({
    include_platform: z.boolean().optional().default(false).describe("Include platform contract addresses"),
    limit: z.number().optional().default(100).describe("Limit the number of results (max 1000)"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
 export const COINS_LIST_PROMPT = `
  This tool fetches the list of all cryptocurrencies from the CoinGecko API.
  
  Optional inputs:
  - include_platform: Include platform contract addresses (default: false)
  - limit: Limit the number of results, max 1000 (default: 100)
  
  Examples:
  - Basic usage: {}
  - With platforms: { "include_platform": true }
  - Limited results: { "limit": 10 }
  
  Important notes:
  - This endpoint is available on the free CoinGecko API plan
  - Rate limits apply (10-50 calls/minute depending on usage)
  - The full list contains thousands of coins, so use the limit parameter to restrict results
  - Use the returned coin IDs with other CoinGecko API endpoints
  `;