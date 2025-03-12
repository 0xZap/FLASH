import { z } from "zod";

export const GET_COINS_MARKETS_ACTION_NAME = "get_coins_markets";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the CoinGecko coins markets tool inputs
 */
export const CoinsMarketsSchema = z.object({
    vs_currency: z.string().optional().default("usd").describe("The target currency of market data (e.g., 'usd', 'eur', 'jpy')"),
    ids: z.array(z.string()).optional().describe("List of coin IDs to filter (e.g., ['bitcoin', 'ethereum'])"),
    category: z.string().optional().describe("Filter by coin category"),
    order: z.enum([
      "market_cap_desc", "market_cap_asc", 
      "volume_desc", "volume_asc", 
      "id_desc", "id_asc", 
      "gecko_desc", "gecko_asc"
    ]).optional().default("market_cap_desc").describe("Sort results by field"),
    per_page: z.number().optional().default(10).describe("Number of results per page (1-250)"),
    page: z.number().optional().default(1).describe("Page number"),
    sparkline: z.boolean().optional().default(false).describe("Include sparkline 7d data"),
    price_change_percentage: z.array(z.enum(["1h", "24h", "7d", "14d", "30d", "200d", "1y"])).optional().describe("Include price change percentage for specified time periods"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const COINS_MARKETS_PROMPT = `
  This tool fetches cryptocurrency market data from CoinGecko.
  
  Optional inputs:
  - vs_currency: The target currency of market data (default: 'usd')
  - ids: List of coin IDs to filter (e.g., ['bitcoin', 'ethereum'])
  - category: Filter by coin category
  - order: Sort results by field (default: 'market_cap_desc')
    Options: 'market_cap_desc', 'market_cap_asc', 'volume_desc', 'volume_asc', 'id_desc', 'id_asc', 'gecko_desc', 'gecko_asc'
  - per_page: Number of results per page, max 250 (default: 10)
  - page: Page number (default: 1)
  - sparkline: Include sparkline 7d data (default: false)
  - price_change_percentage: Include price change percentage for specified time periods
    Options: '1h', '24h', '7d', '14d', '30d', '200d', '1y'
  
  Examples:
  - Basic usage: {}
  - Top 5 by market cap: { "per_page": 5 }
  - Specific coins: { "ids": ["bitcoin", "ethereum"] }
  - With price changes: { "price_change_percentage": ["24h", "7d"] }
  
  Important notes:
  - This endpoint is available on the free CoinGecko API plan
  - Rate limits apply (10-50 calls/minute depending on usage)
  `;