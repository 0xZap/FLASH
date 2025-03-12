import { z } from "zod";

export const GET_COIN_PRICES_ACTION_NAME = "get_coin_prices";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the CoinGecko coin prices tool inputs
 */
export const CoinPricesSchema = z.object({
    coin_ids: z.array(z.string()).min(1).describe("Array of coin IDs to fetch prices for (e.g., ['bitcoin', 'ethereum'])"),
    vs_currencies: z.array(z.string()).optional().default(["usd"]).describe("Array of currencies to convert to (e.g., ['usd', 'eur'])"),
    include_market_cap: z.boolean().optional().default(false).describe("Include market cap data"),
    include_24h_vol: z.boolean().optional().default(false).describe("Include 24h volume data"),
    include_24h_change: z.boolean().optional().default(false).describe("Include 24h price change data"),
    include_last_updated_at: z.boolean().optional().default(false).describe("Include last updated timestamp"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
 export const COIN_PRICES_PROMPT = `
  This tool fetches current cryptocurrency prices from the CoinGecko API.
  
  Required inputs:
  - coin_ids: Array of coin IDs to fetch prices for (e.g., ['bitcoin', 'ethereum', 'solana'])
  
  Optional inputs:
  - vs_currencies: Array of currencies to convert to (default: ['usd'])
  - include_market_cap: Include market cap data (default: false)
  - include_24h_vol: Include 24h volume data (default: false)
  - include_24h_change: Include 24h price change data (default: false)
  - include_last_updated_at: Include last updated timestamp (default: false)
  
  Examples:
  - Basic price check: { "coin_ids": ["bitcoin", "ethereum"] }
  - Multi-currency check: { "coin_ids": ["bitcoin"], "vs_currencies": ["usd", "eur", "jpy"] }
  - Detailed data: { "coin_ids": ["bitcoin"], "include_market_cap": true, "include_24h_change": true }
  
  Important notes:
  - This endpoint is available on the free CoinGecko API plan
  - Rate limits apply (10-50 calls/minute depending on usage)
  - For coin IDs, use the 'id' field from the /coins/list endpoint
  `;