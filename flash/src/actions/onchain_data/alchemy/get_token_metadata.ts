import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";
import { TokenMetadataResponse } from "alchemy-sdk";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy token metadata tool inputs
 */
const TokenMetadataSchema = z.object({
  contractAddress: z.string().describe("The token contract address to fetch metadata for"),
  network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const TOKEN_METADATA_PROMPT = `
This tool fetches detailed metadata for a token contract using the Alchemy API.

Required inputs:
- contractAddress: The token contract address to fetch metadata for

Optional inputs:
- network: The network to query (default: "ETH_MAINNET")
  Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, etc.

Examples:
- Basic usage: {
    "contractAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
  }
- On Polygon network: {
    "contractAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "network": "MATIC_MAINNET"
  }

Important notes:
- Requires a valid Alchemy API key
- Returns token metadata including name, symbol, decimals, and logo
- Some tokens may have incomplete metadata
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
  };
  
  return networkMap[networkString] || Network.ETH_MAINNET;
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches token metadata from Alchemy
 * @param inputs The contract address and network
 * @returns Formatted token metadata
 */
export async function getTokenMetadata(inputs: z.infer<typeof TokenMetadataSchema>): Promise<string> {
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
    
    // Fetch token metadata
    const metadata = await alchemy.core.getTokenMetadata(inputs.contractAddress);
    
    // Format results
    if (!metadata) {
      return `No metadata found for token contract ${inputs.contractAddress} on ${inputs.network}.`;
    }
    
    // Build formatted response
    let formattedResponse = `Token Metadata for ${inputs.contractAddress} on ${inputs.network}:\n\n`;
    
    // Add basic token info (only using properties defined in TokenMetadataResponse)
    formattedResponse += `Name: ${metadata.name || 'Unknown'}\n`;
    formattedResponse += `Symbol: ${metadata.symbol || 'Unknown'}\n`;
    formattedResponse += `Decimals: ${metadata.decimals || 'Unknown'}\n`;
    
    // Add logo info if available
    if (metadata.logo) {
      formattedResponse += `Logo URL: ${metadata.logo}\n`;
    }
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy token metadata fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy token metadata fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetTokenMetadataAction implements ZapAction<typeof TokenMetadataSchema> {
  public name = "get_token_metadata";
  public description = TOKEN_METADATA_PROMPT;
  public schema = TokenMetadataSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getTokenMetadata({
      contractAddress: args.contractAddress,
      network: args.network,
    });
}

// Export types for testing
export type TokenMetadataRequest = z.infer<typeof TokenMetadataSchema>; 