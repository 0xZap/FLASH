import { z } from "zod";

export const GET_COIN_DATA_ACTION_NAME = "get_coin_data";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the input parameters of the tool
 */
export const CoinDataSchema = z.object({
    id: z.string().describe("The ID of the coin to fetch data for (e.g., 'bitcoin', 'ethereum')"),
    localization: z.boolean().optional().describe("Include localized data (default: false)"),
    tickers: z.boolean().optional().describe("Include ticker data (default: false)"),
    market_data: z.boolean().optional().describe("Include market data (default: true)"),
    community_data: z.boolean().optional().describe("Include community data (default: false)"),
    developer_data: z.boolean().optional().describe("Include developer data (default: false)"),
    sparkline: z.boolean().optional().describe("Include sparkline data (default: false)"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Description of what the tool does and how to use it
   */
  export const COIN_DATA_PROMPT = `
  Get detailed data for a specific cryptocurrency by its ID.
  
  This tool fetches comprehensive information about a cryptocurrency, including:
  - Basic information (name, symbol, description)
  - Market data (price, market cap, volume, etc.)
  - Links (website, social media, etc.)
  - Developer activity
  - Community statistics
  
  Example usage:
  - Get detailed data for Bitcoin: \`{ "id": "bitcoin" }\`
  - Get Ethereum data with community stats: \`{ "id": "ethereum", "community_data": true }\`
  - Get Solana data with tickers: \`{ "id": "solana", "tickers": true }\`
  `;