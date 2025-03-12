import { z } from "zod";

export const GET_GAS_PRICE_ACTION_NAME = "get_gas_price";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy gas price tool inputs
 */
export const GasPriceSchema = z.object({
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const GAS_PRICE_PROMPT = `
  This tool fetches the current gas price from a blockchain network using the Alchemy API (eth_gasPrice).
  
  Optional inputs:
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.
  
  Examples:
  - Ethereum Mainnet: { "network": "ETH_MAINNET" }
  - Polygon/Matic: { "network": "MATIC_MAINNET" }
  - Arbitrum: { "network": "ARB_MAINNET" }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Returns the current gas price in Wei, Gwei, and native currency units
  - For EIP-1559 networks, this returns the base fee + priority fee estimate
  - Used for estimating transaction costs and determining appropriate gas prices
  `;