import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy fee history tool inputs
 */
const FeeHistorySchema = z.object({
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
const FEE_HISTORY_PROMPT = `
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
 * Function that fetches fee history from Alchemy
 * @param inputs The fee history query parameters
 * @returns Formatted fee history information
 */
export async function getFeeHistory(inputs: z.infer<typeof FeeHistorySchema>): Promise<string> {
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
    
    // Prepare parameters for eth_feeHistory RPC call
    const params = [
      "0x" + inputs.blockCount.toString(16), // Convert to hex string
      inputs.newestBlock,
      inputs.rewardPercentiles || []
    ];
    
    // Fetch fee history using the JSON-RPC method
    const feeHistory = await alchemy.core.send("eth_feeHistory", params);
    
    if (!feeHistory) {
      return `No fee history data found for the specified parameters on ${inputs.network}.`;
    }
    
    // Format the response
    let formattedResponse = `Fee History on ${inputs.network}:\n\n`;
    
    // Basic information
    formattedResponse += `Oldest Block: ${parseInt(feeHistory.oldestBlock, 16).toLocaleString()}\n`;
    const hasRewardData = feeHistory.reward && feeHistory.reward.length > 0;
    
    // Add percentile information if rewards are included
    if (hasRewardData && inputs.rewardPercentiles) {
      formattedResponse += `Percentiles Requested: ${inputs.rewardPercentiles.join(", ")}%\n`;
    }
    
    formattedResponse += `Block Count: ${feeHistory.baseFeePerGas.length}\n\n`;
    
    // Detail table
    formattedResponse += `Block | Base Fee (Gwei) | Gas Used Ratio`;
    if (hasRewardData) {
      formattedResponse += ` | Reward Percentiles (Gwei)`;
    }
    formattedResponse += `\n`;
    
    formattedResponse += `------|----------------|---------------`;
    if (hasRewardData) {
      formattedResponse += `|------------------------`;
    }
    formattedResponse += `\n`;
    
    // Add data for each block
    for (let i = 0; i < feeHistory.baseFeePerGas.length; i++) {
      const blockNumber = parseInt(feeHistory.oldestBlock, 16) + i;
      const baseFee = parseInt(feeHistory.baseFeePerGas[i], 16) / 1e9; // Convert Wei to Gwei
      const gasUsedRatio = feeHistory.gasUsedRatio[i].toFixed(2);
      
      formattedResponse += `${blockNumber.toLocaleString()} | ${baseFee.toFixed(4)} | ${gasUsedRatio}`;
      
      // Add reward percentiles if available
      if (hasRewardData && feeHistory.reward[i]) {
        const rewards = feeHistory.reward[i].map((reward: string) => (parseInt(reward, 16) / 1e9).toFixed(4));
        formattedResponse += ` | ${rewards.join(", ")}`;
      }
      
      formattedResponse += `\n`;
    }
    
    // Add additional context
    formattedResponse += `\nGas Used Ratio is the fraction of gas used vs. gas limit in each block.\n`;
    if (hasRewardData) {
      formattedResponse += `Reward values represent priority fees paid at each percentile.\n`;
    }
    formattedResponse += `Base Fee is the minimum required fee for inclusion in a block.\n`;
    
    // Add current timestamp for reference
    const timestamp = new Date().toISOString();
    formattedResponse += `\nQueried at: ${timestamp}\n`;
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy fee history fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy fee history fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetFeeHistoryAction implements ZapAction<typeof FeeHistorySchema> {
  public name = "get_fee_history";
  public description = FEE_HISTORY_PROMPT;
  public schema = FeeHistorySchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getFeeHistory({
      blockCount: args.blockCount,
      newestBlock: args.newestBlock,
      rewardPercentiles: args.rewardPercentiles,
      network: args.network,
    });
}

// Export types for testing
export type FeeHistoryRequest = z.infer<typeof FeeHistorySchema>; 