import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the log filter inputs
 */
const LogFilterSchema = z.object({
  address: z.string().optional().describe("Contract address to filter logs"),
  topics: z.array(z.string().or(z.array(z.string())).or(z.null())).optional().describe("Array of topics to filter logs"),
  fromBlock: z.string().optional().describe("Block number or tag to start searching from (e.g., 'latest', or a hex block number)"),
  toBlock: z.string().optional().describe("Block number or tag to end searching at (e.g., 'latest', or a hex block number)"),
  blockHash: z.string().optional().describe("Hash of the block to get logs from (cannot be used with fromBlock/toBlock)"),
});

/**
 * Schema for the Alchemy logs tool inputs
 */
const GetLogsSchema = z.object({
  filter: LogFilterSchema.describe("Filter parameters for the logs query"),
  network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
  maxResults: z.number().optional().default(10).describe("Maximum number of logs to return"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const GET_LOGS_PROMPT = `
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

/**
 * Maps network string to Alchemy Network enum
 * @param networkString Network string (e.g., "ETH_MAINNET")
 * @returns Alchemy Network enum value
 */
function getNetworkFromString(networkString: string): Network {
  const networkMap: {[key: string]: Network} = {
    "ETH_MAINNET": Network.ETH_MAINNET,
    "ETH_GOERLI": Network.ETH_GOERLI,
    "ETH_SEPOLIA": Network.ETH_SEPOLIA,
    "MATIC_MAINNET": Network.MATIC_MAINNET,
    "MATIC_MUMBAI": Network.MATIC_MUMBAI,
    "ASTAR_MAINNET": Network.ASTAR_MAINNET,
    "OPT_MAINNET": Network.OPT_MAINNET,
    "OPT_GOERLI": Network.OPT_GOERLI,
    "ARB_MAINNET": Network.ARB_MAINNET,
    "ARB_GOERLI": Network.ARB_GOERLI,
    "BASE_MAINNET": Network.BASE_MAINNET,
    "BASE_GOERLI": Network.BASE_GOERLI,
  };
  
  return networkMap[networkString] || Network.ETH_MAINNET;
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches logs from Alchemy
 * @param inputs The log filter and options
 * @returns Formatted logs
 */
export async function getLogs(inputs: z.infer<typeof GetLogsSchema>): Promise<string> {
  // Get API key from configuration
  const config = AlchemyConfig.getInstance();
  const apiKey = config.getApiKey();
  
  if (!apiKey) {
    throw new Error("Alchemy API key not found. Please set it in your configuration.");
  }
  
  try {
    // Convert network string to Alchemy Network enum
    const network = getNetworkFromString(inputs.network);
    
    // Initialize Alchemy client with the specified network
    const alchemy = new Alchemy({ 
      apiKey,
      network 
    });
    
    // Prepare the filter for the getLogs call
    const filter = inputs.filter;
    
    // Fetch logs
    const logs = await alchemy.core.getLogs(filter);
    
    // Format the response
    let formattedResponse = `Blockchain Logs on ${inputs.network}:\n\n`;
    
    // Add filter information
    formattedResponse += `Filter:\n`;
    if (filter.address) formattedResponse += `- Contract: ${filter.address}\n`;
    if (filter.topics && filter.topics.length > 0) {
      formattedResponse += `- Topics: ${JSON.stringify(filter.topics)}\n`;
    }
    if (filter.blockHash) formattedResponse += `- Block Hash: ${filter.blockHash}\n`;
    if (filter.fromBlock) formattedResponse += `- From Block: ${filter.fromBlock}\n`;
    if (filter.toBlock) formattedResponse += `- To Block: ${filter.toBlock}\n`;
    
    formattedResponse += `\n`;
    
    // Check if any logs were found
    if (!logs || logs.length === 0) {
      formattedResponse += `No logs found matching the filter criteria.\n`;
      return formattedResponse;
    }
    
    // Limit the number of logs returned
    const limitedLogs = logs.slice(0, inputs.maxResults);
    
    formattedResponse += `Found ${logs.length} logs (showing ${limitedLogs.length}):\n\n`;
    
    // Format each log
    limitedLogs.forEach((log, index) => {
      formattedResponse += `Log #${index + 1}:\n`;
      formattedResponse += `- Address: ${log.address}\n`;
      formattedResponse += `- Block Number: ${parseInt(log.blockNumber, 16)}\n`;
      formattedResponse += `- Transaction Hash: ${log.transactionHash}\n`;
      formattedResponse += `- Transaction Index: ${parseInt(log.transactionIndex, 16)}\n`;
      formattedResponse += `- Log Index: ${parseInt(log.logIndex, 16)}\n`;
      
      // Format topics
      if (log.topics && log.topics.length > 0) {
        formattedResponse += `- Topics:\n`;
        log.topics.forEach((topic, topicIndex) => {
          formattedResponse += `  ${topicIndex}: ${topic}\n`;
        });
      }
      
      // Format data
      if (log.data && log.data !== '0x') {
        formattedResponse += `- Data: ${log.data}\n`;
      }
      
      formattedResponse += `\n`;
    });
    
    // If there are more logs than we're showing
    if (logs.length > inputs.maxResults) {
      formattedResponse += `Note: ${logs.length - inputs.maxResults} additional logs were found but not displayed. Refine your filter or increase maxResults to see more.\n`;
    }
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy logs fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy logs fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetLogsAction implements ZapAction<typeof GetLogsSchema> {
  public name = "get_logs";
  public description = GET_LOGS_PROMPT;
  public schema = GetLogsSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getLogs({
      filter: args.filter,
      network: args.network,
      maxResults: args.maxResults,
    });
}

// Export types for testing
export type GetLogsRequest = z.infer<typeof GetLogsSchema>; 