import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy ETH balance tool inputs
 */
const EthBalanceSchema = z.object({
  address: z.string().describe("The wallet address or ENS name to fetch ETH balance for"),
  blockTag: z.string().optional().default("latest").describe("Block number or tag to fetch balance at (e.g., 'latest', 'pending', or a block number)"),
  network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const ETH_BALANCE_PROMPT = `
This tool fetches the native token balance (ETH, MATIC, etc.) for a wallet address using the Alchemy API.

Required inputs:
- address: The wallet address or ENS name to fetch balance for

Optional inputs:
- blockTag: Block number or tag to fetch balance at (default: "latest")
  Options: "latest", "pending", "finalized", "safe", or a specific block number
- network: The network to query (default: "ETH_MAINNET")
  Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.

Examples:
- Basic usage: { "address": "vitalik.eth" }
- Specific block: { "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "blockTag": "15000000" }
- On Polygon: { "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "network": "MATIC_MAINNET" }

Important notes:
- Requires a valid Alchemy API key
- Supports both hex addresses and ENS names (on Ethereum mainnet)
- Returns balance in native currency units (ETH, MATIC, etc.)
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
 * Gets the native currency symbol for a network
 * @param network The network
 * @returns The currency symbol (e.g., ETH, MATIC)
 */
function getNativeCurrencySymbol(network: string): string {
  const currencyMap: {[key: string]: string} = {
    "ETH_MAINNET": "ETH",
    "ETH_GOERLI": "ETH",
    "ETH_SEPOLIA": "ETH",
    "MATIC_MAINNET": "MATIC",
    "MATIC_MUMBAI": "MATIC",
    "ASTAR_MAINNET": "ASTR",
    "OPT_MAINNET": "ETH",
    "OPT_GOERLI": "ETH",
    "ARB_MAINNET": "ETH",
    "ARB_GOERLI": "ETH",
    "BASE_MAINNET": "ETH",
    "BASE_GOERLI": "ETH",
  };
  
  return currencyMap[network] || "ETH";
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches ETH balance from Alchemy
 * @param inputs The address and options
 * @returns Formatted ETH balance information
 */
export async function getEthBalance(inputs: z.infer<typeof EthBalanceSchema>): Promise<string> {
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
    
    // Fetch the ETH balance
    const balance = await alchemy.core.getBalance(inputs.address, inputs.blockTag);
    
    // Get the native currency symbol
    const currencySymbol = getNativeCurrencySymbol(inputs.network);
    
    // Format the response
    let formattedResponse = `Native Token Balance for ${inputs.address}:\n\n`;
    
    // Add ENS name if address is not already an ENS
    if (!inputs.address.endsWith('.eth') && network === Network.ETH_MAINNET) {
      try {
        const ensName = await alchemy.core.lookupAddress(inputs.address);
        if (ensName) {
          formattedResponse = `Native Token Balance for ${inputs.address} (${ensName}):\n\n`;
        }
      } catch (error) {
        // Ignore ENS lookup errors
      }
    }
    
    // Convert to native token units (e.g., ETH from wei)
    const balanceInEth = Utils.formatEther(balance);
    
    formattedResponse += `Balance: ${balanceInEth} ${currencySymbol}\n`;
    formattedResponse += `Balance (Wei): ${balance.toString()}\n`;
    formattedResponse += `Block: ${inputs.blockTag}\n\n`;
    
    // Add current timestamp for reference
    const timestamp = new Date().toISOString();
    formattedResponse += `Queried at: ${timestamp}\n`;
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy ETH balance fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy ETH balance fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetEthBalanceAction implements ZapAction<typeof EthBalanceSchema> {
  public name = "get_eth_balance";
  public description = ETH_BALANCE_PROMPT;
  public schema = EthBalanceSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getEthBalance({
      address: args.address,
      blockTag: args.blockTag,
      network: args.network,
    });
}

// Export types for testing
export type EthBalanceRequest = z.infer<typeof EthBalanceSchema>; 