import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";
import { GetLogsSchema, GET_LOGS_PROMPT, GET_LOGS_ACTION_NAME } from "../../../actions_schemas/onchain_data/alchemy/get_logs";

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
      formattedResponse += `- Block Number: ${parseInt(log.blockNumber.toString(), 16)}\n`;
      formattedResponse += `- Transaction Hash: ${log.transactionHash}\n`;
      formattedResponse += `- Transaction Index: ${parseInt(log.transactionIndex.toString(), 16)}\n`;
      formattedResponse += `- Log Index: ${parseInt(log.logIndex.toString(), 16)}\n`;
      
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
  public name = GET_LOGS_ACTION_NAME;
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