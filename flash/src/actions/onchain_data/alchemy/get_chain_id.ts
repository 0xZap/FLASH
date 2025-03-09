import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy chain ID tool inputs
 */
const ChainIdSchema = z.object({
  network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const CHAIN_ID_PROMPT = `
This tool fetches the chain ID of a blockchain network using the Alchemy API.

Optional inputs:
- network: The network to query (default: "ETH_MAINNET")
  Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.

Examples:
- Ethereum Mainnet: { "network": "ETH_MAINNET" }
- Polygon/Matic: { "network": "MATIC_MAINNET" }
- Arbitrum: { "network": "ARB_MAINNET" }

Important notes:
- Requires a valid Alchemy API key
- The chain ID is a unique identifier for each blockchain network
- Used for various purposes including transaction signing and network identification
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
 * Maps commonly known networks to their expected chain IDs
 * This helps verify that the result is correct
 */
function getExpectedChainId(networkString: string): number | null {
  const chainIdMap: {[key: string]: number} = {
    "ETH_MAINNET": 1,
    "ETH_GOERLI": 5,
    "ETH_SEPOLIA": 11155111,
    "MATIC_MAINNET": 137,
    "MATIC_MUMBAI": 80001,
    "OPT_MAINNET": 10,
    "OPT_GOERLI": 420,
    "ARB_MAINNET": 42161,
    "ARB_GOERLI": 421613,
    "BASE_MAINNET": 8453,
    "BASE_GOERLI": 84531,
  };
  
  return chainIdMap[networkString] || null;
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches chain ID from Alchemy
 * @param inputs The network to query
 * @returns Formatted chain ID information
 */
export async function getChainId(inputs: z.infer<typeof ChainIdSchema>): Promise<string> {
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
    
    // Get the expected chain ID (if known)
    const expectedChainId = getExpectedChainId(inputs.network);
    
    // Fetch the chain ID using the JSON-RPC method
    const chainIdHex = await alchemy.connection.send("eth_chainId", []);
    
    // Convert hex string to decimal
    const chainId = parseInt(chainIdHex, 16);
    
    // Format the response
    let formattedResponse = `Chain ID for ${inputs.network}:\n\n`;
    formattedResponse += `Chain ID (decimal): ${chainId}\n`;
    formattedResponse += `Chain ID (hex): ${chainIdHex}\n\n`;
    
    // Add verification if we have an expected value
    if (expectedChainId !== null) {
      if (expectedChainId === chainId) {
        formattedResponse += `✅ Verified: Chain ID matches the expected value for ${inputs.network}\n`;
      } else {
        formattedResponse += `⚠️ Warning: Chain ID ${chainId} does not match the expected value ${expectedChainId} for ${inputs.network}\n`;
      }
    }
    
    // Add current timestamp for reference
    const timestamp = new Date().toISOString();
    formattedResponse += `\nQueried at: ${timestamp}\n`;
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy chain ID fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy chain ID fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetChainIdAction implements ZapAction<typeof ChainIdSchema> {
  public name = "get_chain_id";
  public description = CHAIN_ID_PROMPT;
  public schema = ChainIdSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getChainId({
      network: args.network,
    });
}

// Export types for testing
export type ChainIdRequest = z.infer<typeof ChainIdSchema>; 