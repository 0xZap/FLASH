import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";
import { TokenBalancesSchema, TOKEN_BALANCES_PROMPT, GET_TOKEN_BALANCES_ACTION_NAME } from "../../../actions_schemas/onchain_data/alchemy/get_token_balances";

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
 * Function that fetches token balances from Alchemy
 * @param inputs The wallet address and options
 * @returns Formatted token balance results
 */
export async function getTokenBalances(inputs: z.infer<typeof TokenBalancesSchema>): Promise<string> {
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
    
    // Fetch token balances
    let result;
    if (inputs.tokenAddresses && inputs.tokenAddresses.length > 0) {
      // Fetch specific token balances
      result = await alchemy.core.getTokenBalances(inputs.address, inputs.tokenAddresses);
    } else {
      // Fetch all token balances
      result = await alchemy.core.getTokenBalances(inputs.address);
    }
    
    // Format results
    if (!result || !result.tokenBalances || result.tokenBalances.length === 0) {
      return `No token balances found for address ${inputs.address} on ${inputs.network}.`;
    }
    
    // Build formatted response
    let formattedResponse = `Token balances for ${inputs.address} on ${inputs.network}:\n\n`;
    
    // Define interface for token data
    interface TokenData {
      name: string;
      symbol: string;
      balance: string;
      contractAddress: string;
      decimals: number;
    }

    // Create an array to store token data with metadata
    const tokenDataArray: TokenData[] = [];
    
    // Fetch token metadata for each token
    for (const token of result.tokenBalances) {
      if (token.tokenBalance === "0") continue; // Skip zero balances
      
      try {
        const contractAddress = token.contractAddress;
        const metadata = await alchemy.core.getTokenMetadata(contractAddress);
        
        // Calculate actual token balance using decimals
        const rawBalance = token.tokenBalance;
        const decimals = metadata.decimals || 18;
        const balance = parseInt(rawBalance || "0") / Math.pow(10, decimals);
        
        tokenDataArray.push({
          name: metadata.name || "Unknown Token",
          symbol: metadata.symbol || "???",
          balance: balance.toFixed(decimals > 4 ? 4 : decimals), // Limit decimal places for readability
          contractAddress: contractAddress,
          decimals: decimals
        });
      } catch (error) {
        // If metadata fetch fails, add basic info
        tokenDataArray.push({
          name: "Unknown Token",
          symbol: "???",
          balance: token.tokenBalance || "0",
          contractAddress: token.contractAddress,
          decimals: 0
        });
      }
    }
    
    // Sort tokens by balance (descending)
    tokenDataArray.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
    
    // Add a header row
    formattedResponse += `# | Token | Symbol | Balance | Contract Address\n`;
    formattedResponse += `--|-------|--------|---------|------------------\n`;
    
    // Add data rows
    tokenDataArray.forEach((token, index) => {
      formattedResponse += `${index + 1} | ${token.name} | ${token.symbol} | ${token.balance} | ${token.contractAddress}\n`;
    });
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy token balance fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy token balance fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetTokenBalancesAction implements ZapAction<typeof TokenBalancesSchema> {
  public name = GET_TOKEN_BALANCES_ACTION_NAME;
  public description = TOKEN_BALANCES_PROMPT;
  public schema = TokenBalancesSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getTokenBalances({
      address: args.address,
      tokenAddresses: args.tokenAddresses,
      network: args.network,
    });
}

// Export types for testing
export type TokenBalancesRequest = z.infer<typeof TokenBalancesSchema>; 