import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy transaction info tool inputs
 */
const TransactionInfoSchema = z.object({
  txHash: z.string().describe("The transaction hash to fetch details for"),
  network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const TRANSACTION_INFO_PROMPT = `
This tool fetches detailed information about a blockchain transaction using the Alchemy API.

Required inputs:
- txHash: The transaction hash to fetch details for

Optional inputs:
- network: The network to query (default: "ETH_MAINNET")
  Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.

Examples:
- Basic usage: { "txHash": "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b" }
- On Polygon: { "txHash": "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b", "network": "MATIC_MAINNET" }

Important notes:
- Requires a valid Alchemy API key
- Returns complete transaction details including status, gas used, and receipt
- Transaction hash must be a valid 0x-prefixed hex string
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
 * Function that fetches transaction details from Alchemy
 * @param inputs The transaction hash and network
 * @returns Formatted transaction information
 */
export async function getTransaction(inputs: z.infer<typeof TransactionInfoSchema>): Promise<string> {
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
    
    // Fetch the transaction
    const tx = await alchemy.core.getTransaction(inputs.txHash);
    
    if (!tx) {
      return `No transaction found with hash ${inputs.txHash} on ${inputs.network}.`;
    }
    
    // Also get the transaction receipt for additional information
    const receipt = await alchemy.core.getTransactionReceipt(inputs.txHash);
    
    // Get the native currency symbol
    const currencySymbol = getNativeCurrencySymbol(inputs.network);
    
    // Format the response
    let formattedResponse = `Transaction Details for ${inputs.txHash} on ${inputs.network}:\n\n`;
    
    // Basic transaction information
    formattedResponse += `Status: ${receipt?.status === 1 ? '✅ Success' : '❌ Failed'}\n`;
    formattedResponse += `Block Number: ${tx.blockNumber || 'Pending'}\n`;
    formattedResponse += `From: ${tx.from}\n`;
    formattedResponse += `To: ${tx.to || 'Contract Creation'}\n`;
    
    // Value information
    const valueInEth = Utils.formatEther(tx.value);
    formattedResponse += `Value: ${valueInEth} ${currencySymbol}\n`;
    
    // Gas information
    formattedResponse += `Gas Price: ${Utils.formatUnits(tx.gasPrice || 0, 'gwei')} Gwei\n`;
    formattedResponse += `Gas Limit: ${tx.gasLimit.toString()}\n`;
    
    if (receipt) {
      formattedResponse += `Gas Used: ${receipt.gasUsed.toString()} (${Math.round(receipt.gasUsed.toNumber() * 100 / tx.gasLimit.toNumber())}%)\n`;
      
      // Calculate transaction fee
      const txFee = receipt.gasUsed.mul(tx.gasPrice || 0);
      const txFeeInEth = Utils.formatEther(txFee);
      formattedResponse += `Transaction Fee: ${txFeeInEth} ${currencySymbol}\n`;
    }
    
    // Nonce
    formattedResponse += `Nonce: ${tx.nonce}\n\n`;
    
    // Event logs (if available)
    if (receipt && receipt.logs && receipt.logs.length > 0) {
      const logCount = receipt.logs.length;
      formattedResponse += `Event Logs: ${logCount} log entries\n`;
      
      // Show a sample of logs if there are many
      const logsToShow = Math.min(3, logCount);
      if (logsToShow > 0) {
        formattedResponse += `Sample of ${logsToShow} logs:\n`;
        
        for (let i = 0; i < logsToShow; i++) {
          const log = receipt.logs[i];
          formattedResponse += `- Log #${i + 1}: From contract ${log.address}\n`;
          if (log.topics && log.topics.length > 0) {
            formattedResponse += `  Topic 0: ${log.topics[0]}\n`;
          }
        }
        
        if (logCount > logsToShow) {
          formattedResponse += `... and ${logCount - logsToShow} more logs.\n`;
        }
      }
    } else {
      formattedResponse += `Event Logs: None\n`;
    }
    
    // Add link to block explorer
    let explorerUrl = '';
    if (network === Network.ETH_MAINNET) {
      explorerUrl = `https://etherscan.io/tx/${inputs.txHash}`;
    } else if (network === Network.MATIC_MAINNET) {
      explorerUrl = `https://polygonscan.com/tx/${inputs.txHash}`;
    } else if (network === Network.ARB_MAINNET) {
      explorerUrl = `https://arbiscan.io/tx/${inputs.txHash}`;
    } else if (network === Network.OPT_MAINNET) {
      explorerUrl = `https://optimistic.etherscan.io/tx/${inputs.txHash}`;
    } else if (network === Network.BASE_MAINNET) {
      explorerUrl = `https://basescan.org/tx/${inputs.txHash}`;
    }
    
    if (explorerUrl) {
      formattedResponse += `\nView on Explorer: ${explorerUrl}\n`;
    }
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy transaction fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy transaction fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetTransactionAction implements ZapAction<typeof TransactionInfoSchema> {
  public name = "get_transaction";
  public description = TRANSACTION_INFO_PROMPT;
  public schema = TransactionInfoSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getTransaction({
      txHash: args.txHash,
      network: args.network,
    });
}

// Export types for testing
export type TransactionInfoRequest = z.infer<typeof TransactionInfoSchema>; 