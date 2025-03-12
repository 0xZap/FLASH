import { z } from "zod";

export const GET_TOP_GAINERS_LOSERS_ACTION_NAME = "get_top_gainers_losers";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the CoinGecko Pro top gainers and losers tool inputs
 */
export const TopGainersLosersProSchema = z.object({
    vs_currency: z.string().optional().default("usd").describe("The target currency of market data (e.g., 'usd', 'eur', 'jpy')"),
    duration: z.enum(["1h", "24h", "7d", "14d", "30d", "60d", "1y"]).optional().default("24h").describe("Time duration for price change calculation"),
    top_count: z.number().optional().default(10).describe("Number of top gainers/losers to return (max 30)"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const TOP_GAINERS_LOSERS_PRO_PROMPT = `
  This tool fetches the top cryptocurrency gainers and losers from CoinGecko Pro API.
  
  Optional inputs:
  - vs_currency: The target currency of market data (default: 'usd')
  - duration: Time duration for price change calculation (default: '24h')
    Options: '1h', '24h', '7d', '14d', '30d', '60d', '1y'
  - top_count: Number of top gainers/losers to return, max 30 (default: 10)
  
  Examples:
  - Basic usage: {}
  - Custom currency: { "vs_currency": "eur" }
  - Weekly changes: { "duration": "7d", "top_count": 5 }
  
  Important notes:
  - Only includes coins with a 24-hour trading volume of at least $50,000
  - Data is updated every 5 minutes
  - Requires a CoinGecko Pro API key (paid plan)
  `;