import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";
import { HistoricalPriceInterval } from "alchemy-sdk";
import { HistoricalTokenPriceSchema, HISTORICAL_TOKEN_PRICE_PROMPT, GET_HISTORICAL_TOKEN_PRICES_ACTION_NAME } from "../../../actions_schemas/onchain_data/alchemy/get_historical_token_prices";

/**
 * Maps network string to Alchemy Network enum
 */
function getNetworkFromString(networkString: string): Network {
  const networkMap: { [key: string]: Network } = {
    "ETH_MAINNET": Network.ETH_MAINNET,
    "ETH_SEPOLIA": Network.ETH_SEPOLIA,
    "MATIC_MAINNET": Network.MATIC_MAINNET,
    "OPT_MAINNET": Network.OPT_MAINNET,
    "ARB_MAINNET": Network.ARB_MAINNET,
    "BASE_MAINNET": Network.BASE_MAINNET,
  };
  
  const network = networkMap[networkString];
  if (!network) {
    throw new Error(`Unsupported network: ${networkString}`);
  }
  return network;
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches historical token prices from Alchemy
 * @param inputs The token symbol, time range, and interval
 * @returns Formatted historical price results
 */
export async function getHistoricalTokenPrices(inputs: z.infer<typeof HistoricalTokenPriceSchema>): Promise<string> {
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
      network: inputs.network,
      address: inputs.address,
      startTime: inputs.startTime,
      endTime: inputs.endTime,
      interval: inputs.interval,
    };
    
    // Fetch historical token prices
    const network = getNetworkFromString(requestData.network);
    const result = await alchemy.prices.getHistoricalPriceByAddress(
      network,
      requestData.address, 
      requestData.startTime, 
      requestData.endTime, 
      requestData.interval as HistoricalPriceInterval
    );
    
    // Format results
    if (!result || !result.data || !result.data.values || result.data.values.length === 0) {
      return `No historical price data found for ${inputs.address} in the specified time range.`;
    }
    
    // Build formatted response
    let formattedResponse = `Historical prices for ${inputs.address} (${inputs.interval} interval):\n\n`;
    formattedResponse += `Time range: ${inputs.startTime} to ${inputs.endTime}\n`;
    
    // Add a header row
    formattedResponse += `Timestamp | Open | High | Low | Close | Volume\n`;
    formattedResponse += `---------|------|------|-----|-------|-------\n`;
    
    // Add data rows
    Array.from(result.data.values()).forEach((price) => {
      const timestamp = new Date(price.timestamp).toISOString();
      formattedResponse += `${timestamp} | ${price.value}\n`;
    });
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy historical price fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy historical price fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetHistoricalTokenPricesAction implements ZapAction<typeof HistoricalTokenPriceSchema> {
  public name = GET_HISTORICAL_TOKEN_PRICES_ACTION_NAME;
  public description = HISTORICAL_TOKEN_PRICE_PROMPT;
  public schema = HistoricalTokenPriceSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getHistoricalTokenPrices({
      network: args.network,
      address: args.address,
      startTime: args.startTime,
      endTime: args.endTime,
      interval: args.interval,
    });
}

// Export types for testing
export type HistoricalTokenPriceRequest = z.infer<typeof HistoricalTokenPriceSchema>; 