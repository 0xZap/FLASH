import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";
import { TokenPriceByAddressSchema, TOKEN_PRICE_BY_ADDRESS_PROMPT, GET_TOKEN_PRICE_BY_ADDRESS_ACTION_NAME } from "../../../actions_schemas/onchain_data/alchemy/get_token_price_by_address";

function getNetworkFromString(networkString: string): Network {
  const networkMap: {[key: string]: Network} = {
    "eth-mainnet": Network.ETH_MAINNET,
    "eth-goerli": Network.ETH_GOERLI,
    // Add other networks as needed
  };
  return networkMap[networkString] || Network.ETH_MAINNET;
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches token prices by address from Alchemy
 * @param inputs The token addresses and currencies
 * @returns Formatted price results
 */
export async function getTokenPricesByAddress(inputs: z.infer<typeof TokenPriceByAddressSchema>): Promise<string> {
  // Get API key from configuration
  const config = AlchemyConfig.getInstance();
  const apiKey = config.getApiKey();
  
  if (!apiKey) {
    throw new Error("Alchemy API key not found. Please set it in your configuration.");
  }
  
  try {
    // Initialize Alchemy client
    const alchemy = new Alchemy({ apiKey });
    
    // Prepare the request data with proper Network type
    const requestData = {
      addresses: inputs.addresses.map(addr => ({
        network: getNetworkFromString(addr.network),
        address: addr.address
      }))
    };
    
    // Fetch token prices by address
    const result = await alchemy.prices.getTokenPriceByAddress(requestData.addresses);
    
    // Format results
    if (!result || !result.data || result.data.length === 0) {
      return "No price data found for the specified token addresses.";
    }
    
    // Build formatted response
    let formattedResponse = `Current token prices by address:\n\n`;
    
    result.data.forEach((tokenData) => {
      formattedResponse += `${tokenData.network || 'Unknown Network'}: ${tokenData.address}\n`;
      
      if (tokenData.error) {
        formattedResponse += `  Error: ${tokenData.error}\n`;
        return;
      }
      
      if (!tokenData.prices || tokenData.prices.length === 0) {
        formattedResponse += `  No price data available\n`;
        return;
      }
      
      tokenData.prices.forEach((price) => {
        formattedResponse += `  ${price.currency}: ${price.value}\n`;
        formattedResponse += `  Last Updated: ${price.lastUpdatedAt}\n`;
      });
      
      formattedResponse += "\n";
    });
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy price fetch by address failed: ${error.message}`);
    }
    throw new Error("Alchemy price fetch by address failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetTokenPricesByAddressAction implements ZapAction<typeof TokenPriceByAddressSchema> {
  public name = GET_TOKEN_PRICE_BY_ADDRESS_ACTION_NAME;
  public description = TOKEN_PRICE_BY_ADDRESS_PROMPT;
  public schema = TokenPriceByAddressSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getTokenPricesByAddress({
      addresses: args.addresses,
      currencies: args.currencies,
    });
}

// Export types for testing
export type TokenPriceByAddressRequest = z.infer<typeof TokenPriceByAddressSchema>; 