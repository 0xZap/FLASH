import { z } from "zod";

export const GET_BLOCK_NUMBER_ACTION_NAME = "get_block_number";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy block number tool inputs
 */
export const BlockNumberSchema = z.object({
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const BLOCK_NUMBER_PROMPT = `
  This tool fetches the latest block number from a specified blockchain network using the Alchemy API.
  
  Optional inputs:
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.
  
  Examples:
  - Ethereum Mainnet: { "network": "ETH_MAINNET" }
  - Polygon/Matic: { "network": "MATIC_MAINNET" }
  - Arbitrum: { "network": "ARB_MAINNET" }
  
  Important notes:
  - Requires a valid Alchemy API key
  - The block number represents the current height of the blockchain
  - Used for various purposes including transaction confirmation tracking and chain synchronization
  `;
  