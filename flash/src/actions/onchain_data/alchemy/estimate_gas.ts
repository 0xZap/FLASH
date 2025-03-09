import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for transaction parameters
 */
const TransactionParamsSchema = z.object({
  from: z.string().optional().describe("Sender address"),
  to: z.string().describe("Recipient address or contract address"),
  value: z.string().optional().describe("Amount of ETH to send in hex or decimal string (e.g., '0x1' or '1000000000000000000' for 1 ETH)"),
  data: z.string().optional().describe("Contract call data in hex format"),
  gas: z.string().optional().describe("Gas limit in hex format"),
  gasPrice: z.string().optional().describe("Gas price in hex format (Wei)"),
  maxFeePerGas: z.string().optional().describe("Maximum fee per gas in hex format (Wei) for EIP-1559 transactions"),
  maxPriorityFeePerGas: z.string().optional().describe("Maximum priority fee per gas in hex format (Wei) for EIP-1559 transactions"),
});

/**
 * Schema for the Alchemy estimate gas tool inputs
 */
const EstimateGasSchema = z.object({
  transaction: TransactionParamsSchema.describe("Transaction parameters to estimate gas for"),
  blockTag: z.string().optional().default("latest").describe("Block to estimate gas against (e.g., 'latest' or a block number)"),
  network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const ESTIMATE_GAS_PROMPT = `
This tool estimates the gas required for a transaction using the Alchemy API (eth_estimateGas).

Required inputs:
- transaction: Transaction parameters to estimate gas for
  - to: Recipient address or contract address
  - Optional parameters:
    - from: Sender address (defaults to a zero address if not provided)
    - value: Amount of ETH to send in hex (e.g., "0x1") or decimal string
    - data: Contract call data in hex format
    - gas: Gas limit in hex format
    - gasPrice: Gas price in hex format
    - maxFeePerGas: Max fee per gas for EIP-1559 transactions
    - maxPriorityFeePerGas: Max priority fee for EIP-1559 transactions

Optional inputs:
- blockTag: Block to estimate gas against (default: "latest")
- network: The network to query (default: "ETH_MAINNET")
  Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.

Examples:
- Simple ETH transfer: { 
    "transaction": { 
      "to": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", 
      "value": "0xde0b6b3a7640000" 
    } 
  }

- Contract interaction: {
    "transaction": {
      "to": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "data": "0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000003b9aca00"
    }
  }

Important notes:
- Requires a valid Alchemy API key
- Used to determine how much gas to allocate to a transaction
- For contract interactions, the 'data' field is required
- Values should be in hex format with '0x' prefix
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
    const gasEstimate = await alchemy.connection.send("eth_estimateGas", [transaction, inputs.blockTag]);
    
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
    const gasCostWei = gasEstimateValue * BigInt(gasPrice);
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
  public name = "estimate_gas";
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