import { z } from "zod";

export const GET_COIN_TICKERS_ACTION_NAME = "get_coin_tickers";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the input parameters of the tool
 */
export const CoinTickersSchema = z.object({
    id: z.string().describe("The ID of the coin to fetch tickers for (e.g., 'bitcoin', 'ethereum')"),
    exchange_ids: z.string().optional().describe("Filter tickers by exchange IDs (comma-separated)"),
    include_exchange_logo: z.boolean().optional().describe("Include exchange logo URLs (default: false)"),
    page: z.number().optional().describe("Page number for paginated results (default: 1)"),
    order: z.enum(["trust_score_desc", "trust_score_asc", "volume_desc"]).optional()
      .describe("Order results by trust score or volume (default: trust_score_desc)"),
    depth: z.boolean().optional().describe("Include order book depth data (default: false)"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Description of what the tool does and how to use it
   */
  export const COIN_TICKERS_PROMPT = `
  Get trading tickers for a specific cryptocurrency by its ID.
  
  This tool fetches trading pairs, prices, and volume information from various exchanges for a specific cryptocurrency.
  
  Example usage:
  - Get Bitcoin tickers: \`{ "id": "bitcoin" }\`
  - Get Ethereum tickers from specific exchanges: \`{ "id": "ethereum", "exchange_ids": "binance,coinbase" }\`
  - Get tickers sorted by volume: \`{ "id": "solana", "order": "volume_desc" }\`
  `;