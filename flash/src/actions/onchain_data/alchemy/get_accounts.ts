import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";
import { AccountsSchema, ACCOUNTS_PROMPT, GET_ACCOUNTS_ACTION_NAME } from "../../../actions_schemas/onchain_data/alchemy/get_accounts";


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
 * Function that fetches accounts from Alchemy
 * @param inputs The network to query
 * @returns Formatted accounts information
 */
export async function getAccounts(inputs: z.infer<typeof AccountsSchema>): Promise<string> {
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
    
    // Fetch accounts using the JSON-RPC method
    const accounts = await alchemy.core.send("eth_accounts", []);
    
    // Format the response
    let formattedResponse = `Accounts on ${inputs.network}:\n\n`;
    
    if (!accounts || accounts.length === 0) {
      formattedResponse += `No accounts found. Alchemy nodes typically don't manage private keys, so this is expected.\n`;
      formattedResponse += `This method would return addresses if used with a provider that manages accounts (like MetaMask).\n`;
    } else {
      formattedResponse += `Found ${accounts.length} accounts:\n\n`;
      
      accounts.forEach((account: string, index: number) => {
        formattedResponse += `${index + 1}. ${account}\n`;
      });
    }
    
    // Add current timestamp for reference
    const timestamp = new Date().toISOString();
    formattedResponse += `\nQueried at: ${timestamp}\n`;
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy accounts fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy accounts fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetAccountsAction implements ZapAction<typeof AccountsSchema> {
  public name = GET_ACCOUNTS_ACTION_NAME;
  public description = ACCOUNTS_PROMPT;
  public schema = AccountsSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getAccounts({
      network: args.network,
    });
}

// Export types for testing
export type AccountsRequest = z.infer<typeof AccountsSchema>; 