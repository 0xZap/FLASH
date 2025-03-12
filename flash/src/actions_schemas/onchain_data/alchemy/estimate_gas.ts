import { z } from "zod";

export const ESTIMATE_GAS_ACTION_NAME = "estimate_gas";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for transaction parameters
 */
const TransactionParamsSchema = z.object({
    from: z.string().optional().describe("Sender address"),
    to: z.string().describe("Recipient address or contract address"),
    value: z.string().optional().describe("Amount of ETH to send in hex or decimal string (e.g., '0x1' or '1000000000000000000' for 1 ETH)"),
    data: z.string().optional().describe("Contract call data in hex format"),
    gas: z.string().optional().describe("Gas limit in hex format"),
    gasPrice: z.string().optional().describe("Gas price in hex format (Wei)"),
    maxFeePerGas: z.string().optional().describe("Maximum fee per gas in hex format (Wei) for EIP-1559 transactions"),
    maxPriorityFeePerGas: z.string().optional().describe("Maximum priority fee per gas in hex format (Wei) for EIP-1559 transactions"),
  });
  
  /**
   * Schema for the Alchemy estimate gas tool inputs
   */
  const EstimateGasSchema = z.object({
    transaction: TransactionParamsSchema.describe("Transaction parameters to estimate gas for"),
    blockTag: z.string().optional().default("latest").describe("Block to estimate gas against (e.g., 'latest' or a block number)"),
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
  const ESTIMATE_GAS_PROMPT = `
  This tool estimates the gas required for a transaction using the Alchemy API (eth_estimateGas).
  
  Required inputs:
  - transaction: Transaction parameters to estimate gas for
    - to: Recipient address or contract address
    - Optional parameters:
      - from: Sender address (defaults to a zero address if not provided)
      - value: Amount of ETH to send in hex (e.g., "0x1") or decimal string
      - data: Contract call data in hex format
      - gas: Gas limit in hex format
      - gasPrice: Gas price in hex format
      - maxFeePerGas: Max fee per gas for EIP-1559 transactions
      - maxPriorityFeePerGas: Max priority fee for EIP-1559 transactions
  
  Optional inputs:
  - blockTag: Block to estimate gas against (default: "latest")
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.
  
  Examples:
  - Simple ETH transfer: { 
      "transaction": { 
        "to": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", 
        "value": "0xde0b6b3a7640000" 
      } 
    }
  
  - Contract interaction: {
      "transaction": {
        "to": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "data": "0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000003b9aca00"
      }
    }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Used to determine how much gas to allocate to a transaction
  - For contract interactions, the 'data' field is required
  - Values should be in hex format with '0x' prefix
  `;
  