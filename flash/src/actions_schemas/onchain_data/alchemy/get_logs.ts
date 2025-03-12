import { z } from "zod";

export const GET_LOGS_ACTION_NAME = "get_logs";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the log filter inputs
 */
export const LogFilterSchema = z.object({
    address: z.string().optional().describe("Contract address to filter logs"),
    topics: z.array(z.string().or(z.array(z.string())).or(z.null())).optional().describe("Array of topics to filter logs"),
    fromBlock: z.string().optional().describe("Block number or tag to start searching from (e.g., 'latest', or a hex block number)"),
    toBlock: z.string().optional().describe("Block number or tag to end searching at (e.g., 'latest', or a hex block number)"),
    blockHash: z.string().optional().describe("Hash of the block to get logs from (cannot be used with fromBlock/toBlock)"),
  });
  
  /**
   * Schema for the Alchemy logs tool inputs
   */
  export const GetLogsSchema = z.object({
    filter: LogFilterSchema.describe("Filter parameters for the logs query"),
    network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
    maxResults: z.number().optional().default(10).describe("Maximum number of logs to return"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
  export const GET_LOGS_PROMPT = `
  This tool fetches event logs from the blockchain using the Alchemy API.
  
  Required inputs:
  - filter: Object containing filter parameters
    - address: (optional) Contract address to filter logs
    - topics: (optional) Array of topics to filter logs
    - fromBlock: (optional) Block number or tag to start searching from
    - toBlock: (optional) Block number or tag to end searching at
    - blockHash: (optional) Hash of the block to get logs from (cannot be used with fromBlock/toBlock)
  
  Optional inputs:
  - network: The network to query (default: "ETH_MAINNET")
    Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.
  - maxResults: Maximum number of logs to return (default: 10)
  
  Examples:
  - ERC-20 Transfer events for a specific token: {
      "filter": {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "topics": [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        ]
      }
    }
  - Logs from a specific block: {
      "filter": {
        "blockHash": "0x49664d1de6b3915d7e6fa297ff4b3d1c5328b8ecf2ff0eefb912a4dc5f6ad4a0"
      }
    }
  - Logs from a contract in a block range: {
      "filter": {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "fromBlock": "0xE6B000",
        "toBlock": "0xE6B100"
      }
    }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Topic[0] is usually the event signature hash
  - For ERC-20 Transfer events, topic[0] is 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
  - Block numbers must be in hex format if provided as strings (e.g., "0xE6B100")
  `;
  