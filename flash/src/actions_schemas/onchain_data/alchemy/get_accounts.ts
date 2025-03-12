import { z } from "zod";

export const GET_ACCOUNTS_ACTION_NAME = "get_accounts"; 

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy accounts tool inputs
 */
export const AccountsSchema = z.object({
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
  export const ACCOUNTS_PROMPT = `
  This tool fetches the list of addresses owned by the connected client using the Alchemy API (eth_accounts).
  
  Optional inputs:
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.
  
  Examples:
  - Ethereum Mainnet: { "network": "ETH_MAINNET" }
  - Polygon/Matic: { "network": "MATIC_MAINNET" }
  
  Important notes:
  - Requires a valid Alchemy API key
  - This RPC method often returns an empty list as Alchemy nodes don't manage private keys
  - More useful in environments where the node controls accounts (like MetaMask)
  `;