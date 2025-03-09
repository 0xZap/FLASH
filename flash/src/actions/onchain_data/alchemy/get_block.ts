import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy block info tool inputs
 */
const BlockInfoSchema = z.object({
  blockNumberOrTag: z.union([z.number(), z.string()]).describe("Block number (e.g., 15221026) or block tag (e.g., 'latest', 'finalized')"),
  includeTransactions: z.boolean().optional().default(false).describe("Whether to include full transaction objects in the response"),
  network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const BLOCK_INFO_PROMPT = `
This tool fetches information about a specific block from a blockchain using the Alchemy API.

Required inputs:
- blockNumberOrTag: Block number (e.g., 15221026) or block tag (e.g., 'latest', 'finalized')

Optional inputs:
- includeTransactions: Whether to include full transaction objects (default: false)
  If true, complete transaction details will be included
  If false, only transaction hashes will be included
- network: The network to query (default: "ETH_MAINNET")
  Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, OPT_MAINNET, ARB_MAINNET, etc.

Examples:
- Latest block: { "blockNumberOrTag": "latest" }
- Specific block: { "blockNumberOrTag": 15221026 }
- With transactions: { "blockNumberOrTag": "latest", "includeTransactions": true }
- On Polygon: { "blockNumberOrTag": "latest", "network": "MATIC_MAINNET" }

Important notes:
- Requires a valid Alchemy API key
- Requesting full transactions may result in large responses for blocks with many transactions
- Block numbers must be provided as integers (not hex strings)
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
 * Function that fetches block information from Alchemy
 * @param inputs The block number/tag and options
 * @returns Formatted block information
 */
export async function getBlock(inputs: z.infer<typeof BlockInfoSchema>): Promise<string> {
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
    
    // Fetch the block information
    const block = await alchemy.core.getBlock(inputs.blockNumberOrTag, inputs.includeTransactions);
    
    if (!block) {
      return `No block found for ${inputs.blockNumberOrTag} on ${inputs.network}.`;
    }
    
    // Format the response
    let formattedResponse = `Block Information for ${inputs.blockNumberOrTag} on ${inputs.network}:\n\n`;
    
    // Basic block information
    formattedResponse += `Block Number: ${block.number}\n`;
    formattedResponse += `Hash: ${block.hash}\n`;
    formattedResponse += `Parent Hash: ${block.parentHash}\n`;
    
    // Timestamp
    const timestamp = new Date(Number(block.timestamp) * 1000).toISOString();
    formattedResponse += `Timestamp: ${timestamp}\n`;
    
    // Miner and state
    formattedResponse += `Miner: ${block.miner}\n`;
    formattedResponse += `Difficulty: ${block.difficulty}\n`;
    formattedResponse += `Total Difficulty: ${block.totalDifficulty}\n`;
    formattedResponse += `Gas Used: ${block.gasUsed}\n`;
    formattedResponse += `Gas Limit: ${block.gasLimit}\n`;
    
    // Transactions
    if (Array.isArray(block.transactions)) {
      formattedResponse += `Transaction Count: ${block.transactions.length}\n\n`;
      
      // If requested, include transaction details
      if (inputs.includeTransactions && block.transactions.length > 0 && typeof block.transactions[0] !== 'string') {
        // Show only first few transactions if there are many
        const transactionsToShow = Math.min(5, block.transactions.length);
        formattedResponse += `Showing ${transactionsToShow} of ${block.transactions.length} transactions:\n\n`;
        
        for (let i = 0; i < transactionsToShow; i++) {
          const tx = block.transactions[i];
          if (typeof tx !== 'string') {
            formattedResponse += `Transaction #${i + 1}:\n`;
            formattedResponse += `- Hash: ${tx.hash}\n`;
            formattedResponse += `- From: ${tx.from}\n`;
            formattedResponse += `- To: ${tx.to || 'Contract Creation'}\n`;
            formattedResponse += `- Value: ${tx.value.toString()}\n`;
            formattedResponse += `- Gas Price: ${tx.gasPrice?.toString() || 'N/A'}\n`;
            formattedResponse += `- Gas Limit: ${tx.gasLimit.toString()}\n\n`;
          }
        }
        
        // If we didn't show all transactions
        if (block.transactions.length > transactionsToShow) {
          formattedResponse += `... and ${block.transactions.length - transactionsToShow} more transactions.\n`;
        }
      } else {
        // Just list the transaction hashes
        const hashesToShow = Math.min(10, block.transactions.length);
        if (hashesToShow > 0) {
          formattedResponse += `Transaction Hashes (first ${hashesToShow}):\n`;
          for (let i = 0; i < hashesToShow; i++) {
            const txHash = block.transactions[i];
            formattedResponse += `- ${typeof txHash === 'string' ? txHash : txHash.hash}\n`;
          }
          
          if (block.transactions.length > hashesToShow) {
            formattedResponse += `... and ${block.transactions.length - hashesToShow} more transaction hashes.\n`;
          }
          formattedResponse += `\n`;
        }
      }
    }
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy block info fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy block info fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetBlockAction implements ZapAction<typeof BlockInfoSchema> {
  public name = "get_block";
  public description = BLOCK_INFO_PROMPT;
  public schema = BlockInfoSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getBlock({
      blockNumberOrTag: args.blockNumberOrTag,
      includeTransactions: args.includeTransactions,
      network: args.network,
    });
}

// Export types for testing
export type BlockInfoRequest = z.infer<typeof BlockInfoSchema>; 