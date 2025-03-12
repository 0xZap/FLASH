import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";
import { EstimateGasSchema, ESTIMATE_GAS_PROMPT, ESTIMATE_GAS_ACTION_NAME } from "../../../actions_schemas/onchain_data/alchemy/estimate_gas";

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
 * Function that estimates gas for a transaction using Alchemy
 * @param inputs The transaction parameters and options
 * @returns Formatted gas estimation information
 */
export async function estimateGas(inputs: z.infer<typeof EstimateGasSchema>): Promise<string> {
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
    
    // Prepare transaction parameters
    const transaction = inputs.transaction;
    
    // Fix value field if it's a decimal string
    if (transaction.value && !transaction.value.startsWith('0x')) {
      try {
        // Try to parse as a decimal string and convert to hex
        BigInt(transaction.value); // Will throw if not a valid number
        transaction.value = '0x' + BigInt(transaction.value).toString(16);
      } catch (e) {
        throw new Error(`Invalid value format: ${transaction.value}. Use hex format with 0x prefix or a valid decimal string.`);
      }
    }
    
    // Prepare parameters for eth_estimateGas RPC call
    const params = [
      transaction,
      inputs.blockTag
    ];
    
    // Fetch gas estimation using the JSON-RPC method
    const gasEstimate = await alchemy.core.send("eth_estimateGas", [transaction, inputs.blockTag]);
    
    if (!gasEstimate) {
      return `No gas estimate could be determined for the provided transaction on ${inputs.network}.`;
    }
    
    // Get current gas price for reference
    const gasPrice = await alchemy.core.getGasPrice();
    
    // Format the response
    let formattedResponse = `Gas Estimation on ${inputs.network}:\n\n`;
    
    // Transaction details
    formattedResponse += `Transaction Details:\n`;
    formattedResponse += `- From: ${transaction.from || "Not specified (uses zero address)"}\n`;
    formattedResponse += `- To: ${transaction.to}\n`;
    
    // Format value if present
    if (transaction.value) {
      const valueInWei = BigInt(transaction.value);
      const valueInEth = Utils.formatEther(valueInWei);
      const currencySymbol = getNativeCurrencySymbol(inputs.network);
      formattedResponse += `- Value: ${valueInEth} ${currencySymbol} (${valueInWei.toString()} Wei)\n`;
    } else {
      formattedResponse += `- Value: 0\n`;
    }
    
    // Show data if present
    if (transaction.data && transaction.data !== '0x') {
      // Truncate if too long
      const displayData = transaction.data.length > 50 
        ? `${transaction.data.substring(0, 47)}...` 
        : transaction.data;
      formattedResponse += `- Data: ${displayData}\n`;
      
      // Try to identify function signature (first 4 bytes after 0x)
      if (transaction.data.length >= 10) {
        const functionSignature = transaction.data.substring(0, 10);
        formattedResponse += `  Function Signature: ${functionSignature}\n`;
      }
    } else {
      formattedResponse += `- Data: None (simple transfer)\n`;
    }
    
    // Gas estimation
    formattedResponse += `\nGas Estimation:\n`;
    const gasEstimateValue = BigInt(gasEstimate);
    formattedResponse += `- Estimated Gas: ${gasEstimateValue.toLocaleString()} units\n`;
    
    // Calculate cost
    const gasCostWei = gasEstimateValue * BigInt(gasPrice.toString());
    const gasCostEth = Utils.formatEther(gasCostWei);
    const currencySymbol = getNativeCurrencySymbol(inputs.network);
    
    formattedResponse += `- Current Gas Price: ${(Number(gasPrice) / 1e9).toFixed(2)} Gwei\n`;
    formattedResponse += `- Estimated Cost: ${gasCostEth} ${currencySymbol}\n`;
    
    // Recommendations
    formattedResponse += `\nRecommendations:\n`;
    formattedResponse += `- Set gas limit to at least: ${Math.ceil(Number(gasEstimateValue) * 1.1).toLocaleString()} units (10% buffer)\n`;
    
    // Add note about failed estimation
    formattedResponse += `\nNote: If the transaction would fail, the estimate may be inaccurate or the request would have thrown an error.\n`;
    
    // Add current timestamp for reference
    const timestamp = new Date().toISOString();
    formattedResponse += `\nQueried at: ${timestamp}\n`;
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      return `Gas estimation failed: ${error.message}\n\nThis often means the transaction would fail on-chain. Check your parameters and ensure the contract call is valid.`;
    }
    return "Gas estimation failed with an unknown error. This likely means the transaction would fail if executed.";
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class EstimateGasAction implements ZapAction<typeof EstimateGasSchema> {
  public name = ESTIMATE_GAS_ACTION_NAME;
  public description = ESTIMATE_GAS_PROMPT;
  public schema = EstimateGasSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    estimateGas({
      transaction: args.transaction,
      blockTag: args.blockTag,
      network: args.network,
    });
}

// Export types for testing
export type EstimateGasRequest = z.infer<typeof EstimateGasSchema>; 