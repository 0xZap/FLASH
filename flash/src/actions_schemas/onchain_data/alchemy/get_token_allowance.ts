import { z } from "zod";

export const GET_TOKEN_ALLOWANCE_ACTION_NAME = "get_token_allowance";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy token allowance tool inputs
 */
export const TokenAllowanceSchema = z.object({
    contract: z.string().describe("The token contract address"),
    owner: z.string().describe("The address of the token owner"),
    spender: z.string().describe("The address of the spender (contract or wallet authorized to spend tokens)"),
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const TOKEN_ALLOWANCE_PROMPT = `
  This tool fetches token allowance information using the Alchemy API.
  
  Required inputs:
  - contract: The token contract address
  - owner: The address of the token owner
  - spender: The address of the spender (contract or wallet authorized to spend tokens)
  
  Optional inputs:
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, etc.
  
  Examples:
  - Basic usage: {
      "contract": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      "owner": "0xf1a726210550c306a9964b251cbcd3fa5ecb275d",
      "spender": "0xdef1c0ded9bec7f1a1670819833240f027b25eff"
    }
  - On Ethereum: {
      "contract": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "owner": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "spender": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Used to check how many tokens a spender is allowed to transfer on behalf of the owner
  - Critical for understanding approval relationships for smart contract interactions
  `;