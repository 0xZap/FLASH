import { z } from "zod";

export const GET_TRANSACTION_ACTION_NAME = "get_transaction";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy transaction info tool inputs
 */
export const TransactionInfoSchema = z.object({
    txHash: z.string().describe("The transaction hash to fetch details for"),
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const TRANSACTION_INFO_PROMPT = `
  This tool fetches detailed information about a blockchain transaction using the Alchemy API.
  
  Required inputs:
  - txHash: The transaction hash to fetch details for
  
  Optional inputs:
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.
  
  Examples:
  - Basic usage: { "txHash": "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b" }
  - On Polygon: { "txHash": "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b", "network": "MATIC_MAINNET" }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Returns complete transaction details including status, gas used, and receipt
  - Transaction hash must be a valid 0x-prefixed hex string
  `;