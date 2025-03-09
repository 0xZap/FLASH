import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { CoinGeckoConfig } from "../../../config/coingecko_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the CoinGecko coins list tool inputs
 */
const CoinsListSchema = z.object({
  include_platform: z.boolean().optional().default(false).describe("Include platform contract addresses"),
  limit: z.number().optional().default(100).describe("Limit the number of results (max 1000)"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const COINS_LIST_PROMPT = `
This tool fetches the list of all cryptocurrencies from the CoinGecko API.

Optional inputs:
- include_platform: Include platform contract addresses (default: false)
- limit: Limit the number of results, max 1000 (default: 100)

Examples:
- Basic usage: {}
- With platforms: { "include_platform": true }
- Limited results: { "limit": 10 }

Important notes:
- This endpoint is available on the free CoinGecko API plan
- Rate limits apply (10-50 calls/minute depending on usage)
- The full list contains thousands of coins, so use the limit parameter to restrict results
- Use the returned coin IDs with other CoinGecko API endpoints
`;

/**
 * Interface for CoinGecko API response
 */
interface CoinData {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>;
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches the list of all coins from CoinGecko
 * @param inputs The parameters for the API request
 * @returns Formatted results of coins list
 */
export async function getCoinsList(inputs: z.infer<typeof CoinsListSchema>): Promise<string> {
  // Get API configuration
  const config = CoinGeckoConfig.getInstance();
  const baseUrl = config.getBaseUrl();
  const endpoint = "/coins/list";
  
  try {
    // Prepare request parameters
    const params = new URLSearchParams();
    
    if (inputs.include_platform) {
      params.append("include_platform", "true");
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
    
    const data = await response.json() as CoinData[];
    
    // Check if response contains data
    if (!data || data.length === 0) {
      return "No data returned from CoinGecko API.";
    }
    
    // Limit the number of results
    const limitedData = data.slice(0, Math.min(inputs.limit, 1000));
    
    // Format the results
    let result = `Cryptocurrency List (${limitedData.length} of ${data.length} total):\n\n`;
    
    for (const coin of limitedData) {
      result += `${coin.name} (${coin.symbol.toUpperCase()})\n`;
      result += `  ID: ${coin.id}\n`;
      
      if (inputs.include_platform && coin.platforms) {
        result += "  Platforms:\n";
        
        for (const [platform, address] of Object.entries(coin.platforms)) {
          if (address) {
            result += `    ${platform}: ${address}\n`;
          }
        }
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
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetCoinsListAction implements ZapAction<typeof CoinsListSchema> {
  public name = "get_coins_list";
  public description = COINS_LIST_PROMPT;
  public schema = CoinsListSchema;
  public config = CoinGeckoConfig.getInstance();
  public func = getCoinsList;
}

// Export types for testing
export type CoinsListRequest = z.infer<typeof CoinsListSchema>; 