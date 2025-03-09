import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy historical token price tool inputs
 */
const HistoricalTokenPriceSchema = z.object({
  symbol: z.string().describe("Token symbol to fetch historical prices for (e.g., 'ETH')"),
  startTime: z.string().describe("Start time in ISO format (e.g., '2024-01-01T00:00:00Z')"),
  endTime: z.string().describe("End time in ISO format (e.g., '2024-01-31T23:59:59Z')"),
  interval: z.enum(["1h", "1d", "1w", "1m"]).describe("Time interval between data points: 1h (hourly), 1d (daily), 1w (weekly), 1m (monthly)"),
  currency: z.string().optional().default("USD").describe("Currency to convert to (e.g., 'USD')"),
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
  - "1h": Hourly data
  - "1d": Daily data
  - "1w": Weekly data
  - "1m": Monthly data

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
      symbol: inputs.symbol,
      startTime: inputs.startTime,
      endTime: inputs.endTime,
      interval: inputs.interval,
      currency: inputs.currency
    };
    
    // Fetch historical token prices
    const result = await alchemy.prices.getHistoricalTokenPrice(requestData);
    
    // Format results
    if (!result || !result.data || !result.data.prices || result.data.prices.length === 0) {
      return `No historical price data found for ${inputs.symbol} in the specified time range.`;
    }
    
    // Build formatted response
    let formattedResponse = `Historical prices for ${inputs.symbol} (${inputs.interval} interval):\n\n`;
    formattedResponse += `Time range: ${inputs.startTime} to ${inputs.endTime}\n`;
    formattedResponse += `Currency: ${inputs.currency}\n\n`;
    
    // Add a header row
    formattedResponse += `Timestamp | Open | High | Low | Close | Volume\n`;
    formattedResponse += `---------|------|------|-----|-------|-------\n`;
    
    // Add data rows
    result.data.prices.forEach((price) => {
      const timestamp = new Date(price.timestamp).toISOString();
      formattedResponse += `${timestamp} | ${price.open} | ${price.high} | ${price.low} | ${price.close} | ${price.volume || 'N/A'}\n`;
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
      symbol: args.symbol,
      startTime: args.startTime,
      endTime: args.endTime,
      interval: args.interval,
      currency: args.currency,
    });
}

// Export types for testing
export type HistoricalTokenPriceRequest = z.infer<typeof HistoricalTokenPriceSchema>; 