import { z } from "zod";

export const GET_TOKEN_METADATA_ACTION_NAME = "get_token_metadata";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy token metadata tool inputs
 */
export const TokenMetadataSchema = z.object({
    contractAddress: z.string().describe("The token contract address to fetch metadata for"),
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
  export const TOKEN_METADATA_PROMPT = `
  This tool fetches detailed metadata for a token contract using the Alchemy API.
  
  Required inputs:
  - contractAddress: The token contract address to fetch metadata for
  
  Optional inputs:
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, etc.
  
  Examples:
  - Basic usage: {
      "contractAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    }
  - On Polygon network: {
      "contractAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "network": "MATIC_MAINNET"
    }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Returns token metadata including name, symbol, decimals, and logo
  - Some tokens may have incomplete metadata
  `;
  