import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy block number tool inputs
 */
const BlockNumberSchema = z.object({
  network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const BLOCK_NUMBER_PROMPT = `
This tool fetches the latest block number from a specified blockchain network using the Alchemy API.

Optional inputs:
- network: The network to query (default: "ETH_MAINNET")
  Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.

Examples:
- Ethereum Mainnet: { "network": "ETH_MAINNET" }
- Polygon/Matic: { "network": "MATIC_MAINNET" }
- Arbitrum: { "network": "ARB_MAINNET" }

Important notes:
- Requires a valid Alchemy API key
- The block number represents the current height of the blockchain
- Used for various purposes including transaction confirmation tracking and chain synchronization
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
 * Function that fetches the latest block number from Alchemy
 * @param inputs The network to query
 * @returns Formatted block number information
 */
export async function getBlockNumber(inputs: z.infer<typeof BlockNumberSchema>): Promise<string> {
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
    
    // Fetch the latest block number
    const blockNumber = await alchemy.core.getBlockNumber();
    
    // Format the response
    let formattedResponse = `Latest Block Number on ${inputs.network}:\n\n`;
    formattedResponse += `Block Number: ${blockNumber}\n`;
    formattedResponse += `Hex: 0x${blockNumber.toString(16)}\n\n`;
    
    // Add current timestamp for reference
    const timestamp = new Date().toISOString();
    formattedResponse += `Queried at: ${timestamp}\n`;
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy block number fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy block number fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetBlockNumberAction implements ZapAction<typeof BlockNumberSchema> {
  public name = "get_block_number";
  public description = BLOCK_NUMBER_PROMPT;
  public schema = BlockNumberSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getBlockNumber({
      network: args.network,
    });
}

// Export types for testing
export type BlockNumberRequest = z.infer<typeof BlockNumberSchema>; 