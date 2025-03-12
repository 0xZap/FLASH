import { z } from "zod";

export const GET_BLOCK_ACTION_NAME = "get_block";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy block info tool inputs
 */
export const BlockInfoSchema = z.object({
    blockNumberOrTag: z.union([z.number(), z.string()]).describe("Block number (e.g., 15221026) or block tag (e.g., 'latest', 'finalized')"),
    includeTransactions: z.boolean().optional().default(false).describe("Whether to include full transaction objects in the response"),
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
  export const BLOCK_INFO_PROMPT = `
  This tool fetches information about a specific block from a blockchain using the Alchemy API.
  
  Required inputs:
  - blockNumberOrTag: Block number (e.g., 15221026) or block tag (e.g., 'latest', 'finalized')
  
  Optional inputs:
  - includeTransactions: Whether to include full transaction objects (default: false)
    If true, complete transaction details will be included
    If false, only transaction hashes will be included
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.
  
  Examples:
  - Latest block: { "blockNumberOrTag": "latest" }
  - Specific block: { "blockNumberOrTag": 15221026 }
  - With transactions: { "blockNumberOrTag": "latest", "includeTransactions": true }
  - On Polygon: { "blockNumberOrTag": "latest", "network": "MATIC_MAINNET" }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Requesting full transactions may result in large responses for blocks with many transactions
  - Block numbers must be provided as integers (not hex strings)
  `;