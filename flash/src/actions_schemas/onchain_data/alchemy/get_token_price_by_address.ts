import { z } from "zod";

export const GET_TOKEN_PRICE_BY_ADDRESS_ACTION_NAME = "get_token_price_by_address";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the token addresses to fetch prices for
 */
export const TokenAddressSchema = z.object({
    network: z.string().default("eth-mainnet").describe("The network of the token (e.g., 'eth-mainnet')"),
    address: z.string().describe("The contract address of the token")
  });
  
  /**
   * Schema for the Alchemy token price by address tool inputs
   */
export const TokenPriceByAddressSchema = z.object({
    addresses: z.array(TokenAddressSchema).min(1).describe("Array of token addresses to fetch prices for"),
    currencies: z.array(z.string()).optional().default(["USD"]).describe("Array of currencies to convert to (e.g., ['USD', 'EUR'])"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const TOKEN_PRICE_BY_ADDRESS_PROMPT = `
  This tool fetches current cryptocurrency prices using the Alchemy Price API by token contract addresses.
  
  Required inputs:
  - addresses: Array of token addresses to fetch prices for, each containing:
    - network: The network of the token (default: 'eth-mainnet')
    - address: The contract address of the token
  
  Optional inputs:
  - currencies: Array of currencies to convert to (default: ['USD'])
  
  Examples:
  - Basic price check: { "addresses": [{ "network": "eth-mainnet", "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" }] }
  - Multiple tokens: { "addresses": [
      { "network": "eth-mainnet", "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
      { "network": "eth-mainnet", "address": "0xdac17f958d2ee523a2206206994597c13d831ec7" }
    ]}
  
  Important notes:
  - Requires a valid Alchemy API key
  - Contract addresses must be valid for the specified network
  - Results include the current price and last update time
  `;