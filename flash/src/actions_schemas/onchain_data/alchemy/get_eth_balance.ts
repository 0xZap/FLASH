import { z } from "zod";

export const GET_ETH_BALANCE_ACTION_NAME = "get_eth_balance";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy ETH balance tool inputs
 */
export const EthBalanceSchema = z.object({
    address: z.string().describe("The wallet address or ENS name to fetch ETH balance for"),
    blockTag: z.string().optional().default("latest").describe("Block number or tag to fetch balance at (e.g., 'latest', 'pending', or a block number)"),
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const ETH_BALANCE_PROMPT = `
  This tool fetches the native token balance (ETH, MATIC, etc.) for a wallet address using the Alchemy API.
  
  Required inputs:
  - address: The wallet address or ENS name to fetch balance for
  
  Optional inputs:
  - blockTag: Block number or tag to fetch balance at (default: "latest")
    Options: "latest", "pending", "finalized", "safe", or a specific block number
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.
  
  Examples:
  - Basic usage: { "address": "vitalik.eth" }
  - Specific block: { "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "blockTag": "15000000" }
  - On Polygon: { "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "network": "MATIC_MAINNET" }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Supports both hex addresses and ENS names (on Ethereum mainnet)
  - Returns balance in native currency units (ETH, MATIC, etc.)
  `;