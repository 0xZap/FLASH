import { z } from "zod";

export const GET_FEE_HISTORY_ACTION_NAME = "get_fee_history";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy fee history tool inputs
 */
export const FeeHistorySchema = z.object({
    blockCount: z.number().int().min(1).max(1024).default(10).describe("Number of blocks to fetch fee history for (1-1024)"),
    newestBlock: z.string().default("latest").describe("Block number or tag for the newest block in the range"),
    rewardPercentiles: z.array(z.number().min(0).max(100)).optional().describe("List of percentiles (0-100) at which to calculate fee rewards"),
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
  export const FEE_HISTORY_PROMPT = `
  This tool fetches historical gas fee data from the blockchain using the Alchemy API (eth_feeHistory).
  
  Required inputs:
  - blockCount: Number of blocks to fetch fee history for (default: 10, max: 1024)
  
  Optional inputs:
  - newestBlock: Block number or tag for the newest block (default: "latest")
  - rewardPercentiles: Array of percentiles (0-100) at which to calculate reward values
    Example: [10, 20, 30, 40, 50, 60, 70, 80, 90] will return fees at these percentiles
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.
  
  Examples:
  - Basic usage: { "blockCount": 5 }
  - With percentiles: { 
      "blockCount": 5, 
      "rewardPercentiles": [10, 50, 90] 
    }
  - Specific block range: { 
      "blockCount": 5, 
      "newestBlock": "0x1000000" 
    }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Percentiles show gas price paid at different levels (e.g., 10th percentile vs 90th percentile)
  - Useful for understanding current gas fee market and designing gas strategies
  `;