import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { CoinGeckoConfig } from "../../../config/coingecko_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the CoinGecko coin prices tool inputs
 */
const CoinPricesSchema = z.object({
  coin_ids: z.array(z.string()).min(1).describe("Array of coin IDs to fetch prices for (e.g., ['bitcoin', 'ethereum'])"),
  vs_currencies: z.array(z.string()).optional().default(["usd"]).describe("Array of currencies to convert to (e.g., ['usd', 'eur'])"),
  include_market_cap: z.boolean().optional().default(false).describe("Include market cap data"),
  include_24h_vol: z.boolean().optional().default(false).describe("Include 24h volume data"),
  include_24h_change: z.boolean().optional().default(false).describe("Include 24h price change data"),
  include_last_updated_at: z.boolean().optional().default(false).describe("Include last updated timestamp"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const COIN_PRICES_PROMPT = `
This tool fetches current cryptocurrency prices from the CoinGecko API.

Required inputs:
- coin_ids: Array of coin IDs to fetch prices for (e.g., ['bitcoin', 'ethereum', 'solana'])

Optional inputs:
- vs_currencies: Array of currencies to convert to (default: ['usd'])
- include_market_cap: Include market cap data (default: false)
- include_24h_vol: Include 24h volume data (default: false)
- include_24h_change: Include 24h price change data (default: false)
- include_last_updated_at: Include last updated timestamp (default: false)

Examples:
- Basic price check: { "coin_ids": ["bitcoin", "ethereum"] }
- Multi-currency check: { "coin_ids": ["bitcoin"], "vs_currencies": ["usd", "eur", "jpy"] }
- Detailed data: { "coin_ids": ["bitcoin"], "include_market_cap": true, "include_24h_change": true }

Important notes:
- This endpoint is available on the free CoinGecko API plan
- Rate limits apply (10-50 calls/minute depending on usage)
- For coin IDs, use the 'id' field from the /coins/list endpoint
`;

/**
 * Interface for CoinGecko API response
 */
interface CoinGeckoPricesResponse {
  [coinId: string]: {
    [key: string]: number;  // This covers both currency values and additional fields
  };
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches coin prices from CoinGecko
 * @param inputs The parameters for the API request
 * @returns Formatted results of coin prices
 */
export async function getCoinPrices(inputs: z.infer<typeof CoinPricesSchema>): Promise<string> {
  // Get API configuration
  const config = CoinGeckoConfig.getInstance();
  const baseUrl = config.getBaseUrl();
  const endpoint = "/simple/price";
  
  try {
    // Prepare request parameters
    const params = new URLSearchParams();
    params.append("ids", inputs.coin_ids.join(","));
    params.append("vs_currencies", inputs.vs_currencies.join(","));
    
    if (inputs.include_market_cap) {
      params.append("include_market_cap", "true");
    }
    
    if (inputs.include_24h_vol) {
      params.append("include_24h_vol", "true");
    }
    
    if (inputs.include_24h_change) {
      params.append("include_24h_change", "true");
    }
    
    if (inputs.include_last_updated_at) {
      params.append("include_last_updated_at", "true");
    }
    
    // Add API key if available (for higher rate limits)
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    if (config.hasApiKey()) {
      headers['x-cg-api-key'] = config.getApiKey() as string;
    }
    
    // Make API request
    const response = await fetch(`${baseUrl}${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        return "Rate limit exceeded. Please try again later or use an API key for higher limits.";
      }
      
      return `CoinGecko API error: ${response.statusText}`;
    }
    
    const data = await response.json() as CoinGeckoPricesResponse;
    
    // Check if response contains data
    if (!data || Object.keys(data).length === 0) {
      return "No data returned from CoinGecko API. Check that the coin IDs are valid.";
    }
    
    // Format the results
    let result = "Current Cryptocurrency Prices:\n\n";
    
    for (const coinId of Object.keys(data)) {
      const coinData = data[coinId];
      result += `${capitalizeFirstLetter(coinId)}:\n`;
      
      // Process each currency
      const currencies = inputs.vs_currencies.map(c => c.toLowerCase());
      for (const currency of currencies) {
        if (coinData[currency] !== undefined) {
          result += `  ${currency.toUpperCase()}: ${formatNumber(coinData[currency])}\n`;
          
          // Add additional data if requested and available
          if (inputs.include_market_cap && coinData[`${currency}_market_cap`] !== undefined) {
            result += `  Market Cap (${currency.toUpperCase()}): ${formatNumber(coinData[`${currency}_market_cap`])}\n`;
          }
          
          if (inputs.include_24h_vol && coinData[`${currency}_24h_vol`] !== undefined) {
            result += `  24h Volume (${currency.toUpperCase()}): ${formatNumber(coinData[`${currency}_24h_vol`])}\n`;
          }
          
          if (inputs.include_24h_change && coinData[`${currency}_24h_change`] !== undefined) {
            const change = coinData[`${currency}_24h_change`];
            const arrow = change >= 0 ? "↗" : "↘";
            result += `  24h Change (${currency.toUpperCase()}): ${arrow} ${change.toFixed(2)}%\n`;
          }
        }
      }
      
      // Add last updated timestamp if requested
      if (inputs.include_last_updated_at && coinData.last_updated_at !== undefined) {
        const date = new Date(coinData.last_updated_at * 1000);
        result += `  Last Updated: ${date.toISOString()}\n`;
      }
      
      result += "\n";
    }
    
    return result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `Error fetching data: ${error.message}`;
    }
    
    return "Unknown error occurred while fetching data from CoinGecko.";
  }
}

/**
 * Helper function to capitalize the first letter of a string
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper function to format numbers
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  } else if (num < 0.01) {
    return `$${num.toFixed(8)}`;
  } else {
    return `$${num.toFixed(2)}`;
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetCoinPricesAction implements ZapAction<typeof CoinPricesSchema> {
  public name = "get_coin_prices";
  public description = COIN_PRICES_PROMPT;
  public schema = CoinPricesSchema;
  public config = CoinGeckoConfig.getInstance();
  public func = getCoinPrices;
}

// Export types for testing
export type CoinPricesRequest = z.infer<typeof CoinPricesSchema>; 