import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, AssetTransfersCategory } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";
import { AssetTransfersResult } from "alchemy-sdk";
/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy transactions by address tool inputs
 */
const TransactionsByAddressSchema = z.object({
  address: z.string().describe("The address to fetch transactions for (e.g., '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')"),
  networks: z.array(z.string()).default(["ETH_MAINNET"]).describe("Array of networks to search on (e.g., ['ETH_MAINNET', 'MATIC_MAINNET'])"),
  limit: z.number().optional().default(10).describe("Maximum number of transactions to return"),
  pageKey: z.string().optional().describe("Page key for pagination"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const TRANSACTIONS_BY_ADDRESS_PROMPT = `
This tool fetches transactions for a specific address using the Alchemy API.

Required inputs:
- address: The wallet or contract address to fetch transactions for

Optional inputs:
- networks: Array of networks to search on (default: ["ETH_MAINNET"])
  Available networks: ETH_MAINNET, ETH_GOERLI, ETH_SEPOLIA, MATIC_MAINNET, MATIC_MUMBAI, etc.
- limit: Maximum number of transactions to return (default: 10)
- pageKey: Page key for pagination (for fetching next set of results)

Examples:
- Basic query: { "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" }
- Multi-network: { "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "networks": ["ETH_MAINNET", "MATIC_MAINNET"] }
- With limit: { "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "limit": 5 }

Important notes:
- Requires a valid Alchemy API key
- Returns information about token transfers, contract interactions, and native transactions
- Large addresses may have many transactions; use limit and pagination to manage response size
`;

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches transactions by address from Alchemy
 * @param inputs The address and options
 * @returns Formatted transaction results
 */
export async function getTransactionsByAddress(inputs: z.infer<typeof TransactionsByAddressSchema>): Promise<string> {
  // Get API key from configuration
  const config = AlchemyConfig.getInstance();
  const apiKey = config.getApiKey();
  
  if (!apiKey) {
    throw new Error("Alchemy API key not found. Please set it in your configuration.");
  }
  
  try {
    // Initialize Alchemy client
    const alchemy = new Alchemy({ apiKey });
    
    // Prepare the request data
    const requestData = {
      address: inputs.address,
      network: inputs.networks,
      limit: inputs.limit,
      pageKey: inputs.pageKey
    };
    
    // Fetch transactions by address
    const result = await alchemy.core.getAssetTransfers({
      fromAddress: inputs.address,
      category: [
        AssetTransfersCategory.EXTERNAL,
        AssetTransfersCategory.INTERNAL,
        AssetTransfersCategory.ERC20,
        AssetTransfersCategory.ERC721,
        AssetTransfersCategory.ERC1155
      ],
      maxCount: inputs.limit
    });
    
    // Format results
    if (!result || !result.transfers || result.transfers.length === 0) {
      return `No transactions found for address ${inputs.address} on the specified networks.`;
    }
    
    // Build formatted response
    let formattedResponse = `Transactions for address ${inputs.address}:\n\n`;
    
    // Add pagination info if available
    if (result.pageKey) {
      formattedResponse += `Additional transactions available. Use pageKey "${result.pageKey}" to fetch more.\n\n`;
    }
    
    // Add a header row
    formattedResponse += `# | Type | Asset | From | To | Value | Hash | Timestamp\n`;
    formattedResponse += `--|------|-------|------|-----|-------|------|----------\n`;
    
    // Add data rows
    result.transfers.forEach((tx, index) => {
      // Convert block number to timestamp (since we don't have direct timestamp access)
      const blockNumber = parseInt(tx.blockNum, 16); // Convert hex string to number
      const timestamp = blockNumber ? `Block #${blockNumber}` : 'N/A';
      const asset = tx.asset || 'ETH';
      const value = tx.value ? `${tx.value} ${asset}` : 'N/A';
      const from = tx.from ? shortenAddress(tx.from) : 'N/A';
      const to = tx.to ? shortenAddress(tx.to) : 'N/A';
      const hash = tx.hash ? shortenHash(tx.hash) : 'N/A';
      
      formattedResponse += `${index + 1} | ${tx.category} | ${asset} | ${from} | ${to} | ${value} | ${hash} | ${timestamp}\n`;
    });
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy transaction fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy transaction fetch failed with an unknown error");
  }
}

/**
 * Helper function to shorten addresses for display
 */
function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Helper function to shorten transaction hashes for display
 */
function shortenHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetTransactionsByAddressAction implements ZapAction<typeof TransactionsByAddressSchema> {
  public name = "get_transactions_by_address";
  public description = TRANSACTIONS_BY_ADDRESS_PROMPT;
  public schema = TransactionsByAddressSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getTransactionsByAddress({
      address: args.address,
      networks: args.networks,
      limit: args.limit,
      pageKey: args.pageKey,
    });
}

// Export types for testing
export type TransactionsByAddressRequest = z.infer<typeof TransactionsByAddressSchema>; 