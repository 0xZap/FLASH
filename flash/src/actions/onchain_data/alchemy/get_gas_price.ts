import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy gas price tool inputs
 */
const GasPriceSchema = z.object({
  network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const GAS_PRICE_PROMPT = `
This tool fetches the current gas price from a blockchain network using the Alchemy API (eth_gasPrice).

Optional inputs:
- network: The network to query (default: "ETH_MAINNET")
  Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.

Examples:
- Ethereum Mainnet: { "network": "ETH_MAINNET" }
- Polygon/Matic: { "network": "MATIC_MAINNET" }
- Arbitrum: { "network": "ARB_MAINNET" }

Important notes:
- Requires a valid Alchemy API key
- Returns the current gas price in Wei, Gwei, and native currency units
- For EIP-1559 networks, this returns the base fee + priority fee estimate
- Used for estimating transaction costs and determining appropriate gas prices
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
 * Function that fetches gas price from Alchemy
 * @param inputs The network to query
 * @returns Formatted gas price information
 */
export async function getGasPrice(inputs: z.infer<typeof GasPriceSchema>): Promise<string> {
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
    
    // Fetch gas price using the SDK method
    const gasPrice = await alchemy.core.getGasPrice();
    
    if (!gasPrice) {
      return `No gas price data found for ${inputs.network}.`;
    }
    
    // Format the response
    let formattedResponse = `Current Gas Price on ${inputs.network}:\n\n`;
    
    // Convert to different units
    const gasPriceWei = BigInt(gasPrice);
    const gasPriceGwei = Number(gasPriceWei) / 1e9;
    
    formattedResponse += `• Gas Price: ${gasPriceGwei.toFixed(2)} Gwei\n`;
    formattedResponse += `• Gas Price (Wei): ${gasPriceWei.toString()}\n`;
    
    // Calculate transaction cost examples
    formattedResponse += `\nExample Transaction Costs:\n`;
    
    const currencySymbol = getNativeCurrencySymbol(inputs.network);
    
    // Simple transfer (21000 gas)
    const transferGas = 21000n;
    const transferCostWei = gasPriceWei * transferGas;
    const transferCost = Utils.formatEther(transferCostWei);
    formattedResponse += `• Standard Transfer (21,000 gas): ${transferCost} ${currencySymbol}\n`;
    
    // ERC-20 transfer (65000 gas)
    const erc20Gas = 65000n;
    const erc20CostWei = gasPriceWei * erc20Gas;
    const erc20Cost = Utils.formatEther(erc20CostWei);
    formattedResponse += `• ERC-20 Transfer (~65,000 gas): ${erc20Cost} ${currencySymbol}\n`;
    
    // NFT mint (200000 gas)
    const nftGas = 200000n;
    const nftCostWei = gasPriceWei * nftGas;
    const nftCost = Utils.formatEther(nftCostWei);
    formattedResponse += `• NFT Mint (~200,000 gas): ${nftCost} ${currencySymbol}\n`;
    
    // Context for gas prices
    formattedResponse += `\nGas Price Context:\n`;
    
    // Categorize the gas price
    if (inputs.network === "ETH_MAINNET") {
      if (gasPriceGwei < 15) {
        formattedResponse += `• Current gas price is LOW (< 15 Gwei)\n`;
      } else if (gasPriceGwei < 50) {
        formattedResponse += `• Current gas price is MODERATE (15-50 Gwei)\n`;
      } else if (gasPriceGwei < 150) {
        formattedResponse += `• Current gas price is HIGH (50-150 Gwei)\n`;
      } else {
        formattedResponse += `• Current gas price is VERY HIGH (> 150 Gwei)\n`;
      }
    } else if (inputs.network === "MATIC_MAINNET") {
      if (gasPriceGwei < 50) {
        formattedResponse += `• Current gas price is LOW (< 50 Gwei)\n`;
      } else if (gasPriceGwei < 100) {
        formattedResponse += `• Current gas price is MODERATE (50-100 Gwei)\n`;
      } else if (gasPriceGwei < 200) {
        formattedResponse += `• Current gas price is HIGH (100-200 Gwei)\n`;
      } else {
        formattedResponse += `• Current gas price is VERY HIGH (> 200 Gwei)\n`;
      }
    }
    
    // Add note about EIP-1559
    if (["ETH_MAINNET", "ETH_GOERLI", "ETH_SEPOLIA", "OPT_MAINNET", "ARB_MAINNET", "BASE_MAINNET"].includes(inputs.network)) {
      formattedResponse += `• This network uses EIP-1559 for gas pricing\n`;
      formattedResponse += `• The gas price returned represents a legacy compatible fee (base fee + priority fee)\n`;
      formattedResponse += `• For optimal transactions, consider using maxFeePerGas and maxPriorityFeePerGas\n`;
    }
    
    // Add current timestamp for reference
    const timestamp = new Date().toISOString();
    formattedResponse += `\nQueried at: ${timestamp}\n`;
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy gas price fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy gas price fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetGasPriceAction implements ZapAction<typeof GasPriceSchema> {
  public name = "get_gas_price";
  public description = GAS_PRICE_PROMPT;
  public schema = GasPriceSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getGasPrice({
      network: args.network,
    });
}

// Export types for testing
export type GasPriceRequest = z.infer<typeof GasPriceSchema>; 