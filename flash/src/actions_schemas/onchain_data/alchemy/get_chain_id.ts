import { z } from "zod";

export const GET_CHAIN_ID_ACTION_NAME = "get_chain_id";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy chain ID tool inputs
 */
export const ChainIdSchema = z.object({
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
  export const CHAIN_ID_PROMPT = `
  This tool fetches the chain ID of a blockchain network using the Alchemy API.
  
  Optional inputs:
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.
  
  Examples:
  - Ethereum Mainnet: { "network": "ETH_MAINNET" }
  - Polygon/Matic: { "network": "MATIC_MAINNET" }
  - Arbitrum: { "network": "ARB_MAINNET" }
  
  Important notes:
  - Requires a valid Alchemy API key
  - The chain ID is a unique identifier for each blockchain network
  - Used for various purposes including transaction signing and network identification
  `;
  