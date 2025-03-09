import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";
import { HistoricalPriceInterval } from "alchemy-sdk";
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
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy historical token price tool inputs
 */
const HistoricalTokenPriceSchema = z.object({
  network: z.enum(["ETH_MAINNET", "ETH_SEPOLIA", "MATIC_MAINNET", "OPT_MAINNET", "ARB_MAINNET", "BASE_MAINNET"]).describe("Network name (e.g., 'ETH_MAINNET')"),
  address: z.string().describe("Token contract address"),
  startTime: z.string().describe("Start time in ISO format (e.g., '2024-01-01T00:00:00Z')"),
  endTime: z.string().describe("End time in ISO format (e.g., '2024-01-31T23:59:59Z')"),
  interval: z.enum(["5m", "1h", "1d"]).describe("Time interval between data points"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const HISTORICAL_TOKEN_PRICE_PROMPT = `
This tool fetches historical cryptocurrency prices using the Alchemy Price API.

Required inputs:
- symbol: Token symbol to fetch historical prices for (e.g., 'ETH')
- startTime: Start time in ISO format (e.g., '2024-01-01T00:00:00Z')
- endTime: End time in ISO format (e.g., '2024-01-31T23:59:59Z')
- interval: Time interval between data points:
  - "5m": 5-minute intervals
  - "1h": Hourly data
  - "1d": Daily data

Optional inputs:
- currency: Currency to convert to (default: 'USD')

Examples:
- Daily prices for January 2024: {
    "symbol": "ETH",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-31T23:59:59Z",
    "interval": "1d"
  }
- Hourly prices for a specific day: {
    "symbol": "BTC",
    "startTime": "2024-01-15T00:00:00Z",
    "endTime": "2024-01-15T23:59:59Z",
    "interval": "1h"
  }

Important notes:
- Requires a valid Alchemy API key
- Token symbols are case-sensitive
- Time range should not be too large for small intervals to avoid large response sizes
- Dates must be in ISO format with timezone (e.g., 'Z' for UTC)
`;

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
  public name = "get_historical_token_prices";
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