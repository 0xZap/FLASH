import { z } from "zod";

export const GET_TOKEN_PRICES_ACTION_NAME = "get_token_prices";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy token price tool inputs
 */
export const TokenPriceSchema = z.object({
    symbols: z.array(z.string()).min(1).describe("Array of token symbols to fetch prices for (e.g., ['ETH', 'BTC'])"),
    currencies: z.array(z.string()).optional().default(["USD"]).describe("Array of currencies to convert to (e.g., ['USD', 'EUR'])"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const TOKEN_PRICE_PROMPT = `
  This tool fetches current cryptocurrency prices using the Alchemy Price API.
  
  Required inputs:
  - symbols: Array of token symbols to fetch prices for (e.g., ['ETH', 'BTC', 'USDT'])
  
  Optional inputs:
  - currencies: Array of currencies to convert to (default: ['USD'])
  
  Examples:
  - Basic price check: { "symbols": ["ETH", "BTC"] }
  - Multi-currency check: { "symbols": ["ETH"], "currencies": ["USD", "EUR"] }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Token symbols are case-sensitive
  - Results include the current price and last update time
  `;