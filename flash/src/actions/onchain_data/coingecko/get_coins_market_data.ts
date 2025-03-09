import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { CoinGeckoConfig } from "../../../config/coingecko_config";
import { formatNumber, formatLargeNumber, formatSupply } from "./helpers";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the CoinGecko coins market data tool inputs
 */
const CoinsMarketDataSchema = z.object({
  vs_currency: z.string().optional().default("usd").describe("The target currency (e.g., 'usd', 'eur', 'jpy')"),
  ids: z.array(z.string()).optional().describe("List of coin IDs to filter by (e.g., ['bitcoin', 'ethereum'])"),
  category: z.string().optional().describe("Filter by coin category"),
  order: z.enum([
    "market_cap_desc", "market_cap_asc", 
    "volume_desc", "volume_asc", 
    "id_desc", "id_asc", 
    "gecko_desc", "gecko_asc"
  ]).optional().default("market_cap_desc").describe("Sort results by field"),
  per_page: z.number().optional().default(10).describe("Number of results per page (max 250)"),
  page: z.number().optional().default(1).describe("Page number"),
  sparkline: z.boolean().optional().default(false).describe("Include sparkline 7d data"),
  price_change_percentage: z.array(z.enum(["1h", "24h", "7d", "14d", "30d", "200d", "1y"])).optional().describe("Include price change percentage for specified time periods"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const COINS_MARKET_DATA_PROMPT = `
This tool fetches cryptocurrency market data from the CoinGecko API.

Optional inputs:
- vs_currency: The target currency (default: 'usd')
- ids: List of coin IDs to filter by (e.g., ['bitcoin', 'ethereum'])
- category: Filter by coin category
- order: Sort results by field (default: 'market_cap_desc')
  Options: 'market_cap_desc', 'market_cap_asc', 'volume_desc', 'volume_asc', 'id_desc', 'id_asc', 'gecko_desc', 'gecko_asc'
- per_page: Number of results per page, max 250 (default: 10)
- page: Page number (default: 1)
- sparkline: Include sparkline 7d data (default: false)
- price_change_percentage: Include price change percentage for specified time periods
  Options: ['1h', '24h', '7d', '14d', '30d', '200d', '1y']

Examples:
- Basic usage: {}
- Top 5 by market cap: { "per_page": 5 }
- Specific coins: { "ids": ["bitcoin", "ethereum", "solana"] }
- With price changes: { "price_change_percentage": ["1h", "24h", "7d"] }

Important notes:
- This endpoint is available on the free CoinGecko API plan
- Rate limits apply (10-50 calls/minute depending on usage)
- For large result sets, use pagination with 'page' and 'per_page' parameters
`;

/**
 * Interface for CoinGecko API response
 */
interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_14d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  price_change_percentage_200d_in_currency?: number;
  price_change_percentage_1y_in_currency?: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches coins market data from CoinGecko
 * @param inputs The parameters for the API request
 * @returns Formatted results of coins market data
 */
export async function getCoinsMarketData(inputs: z.infer<typeof CoinsMarketDataSchema>): Promise<string> {
  // Get API configuration
  const config = CoinGeckoConfig.getInstance();
  const baseUrl = config.getBaseUrl();
  const endpoint = "/coins/markets";
  
  try {
    // Prepare request parameters
    const params = new URLSearchParams();
    params.append("vs_currency", inputs.vs_currency);
    
    if (inputs.ids && inputs.ids.length > 0) {
      params.append("ids", inputs.ids.join(","));
    }
    
    if (inputs.category) {
      params.append("category", inputs.category);
    }
    
    params.append("order", inputs.order);
    params.append("per_page", inputs.per_page.toString());
    params.append("page", inputs.page.toString());
    params.append("sparkline", inputs.sparkline.toString());
    
    if (inputs.price_change_percentage && inputs.price_change_percentage.length > 0) {
      params.append("price_change_percentage", inputs.price_change_percentage.join(","));
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
    
    const data = await response.json() as CoinMarketData[];
    
    // Check if response contains data
    if (!data || data.length === 0) {
      return "No data returned from CoinGecko API. Try adjusting your filters.";
    }
    
    // Format the results
    let result = `Cryptocurrency Market Data (${inputs.vs_currency.toUpperCase()}):\n\n`;
    
    data.forEach((coin, index) => {
      result += `${index + 1}. ${coin.name} (${coin.symbol.toUpperCase()})\n`;
      result += `   Rank: #${coin.market_cap_rank || 'N/A'}\n`;
      result += `   Price: ${formatNumber(coin.current_price, inputs.vs_currency)}\n`;
      result += `   Market Cap: ${formatLargeNumber(coin.market_cap)}\n`;
      result += `   24h Volume: ${formatLargeNumber(coin.total_volume)}\n`;
      
      // Add price change data
      if (coin.price_change_percentage_24h) {
        const arrow = coin.price_change_percentage_24h >= 0 ? "↗" : "↘";
        result += `   24h Change: ${arrow} ${coin.price_change_percentage_24h.toFixed(2)}%\n`;
      }
      
      // Add additional price change data if available
      if (coin.price_change_percentage_1h_in_currency) {
        const arrow = coin.price_change_percentage_1h_in_currency >= 0 ? "↗" : "↘";
        result += `   1h Change: ${arrow} ${coin.price_change_percentage_1h_in_currency.toFixed(2)}%\n`;
      }
      
      if (coin.price_change_percentage_7d_in_currency) {
        const arrow = coin.price_change_percentage_7d_in_currency >= 0 ? "↗" : "↘";
        result += `   7d Change: ${arrow} ${coin.price_change_percentage_7d_in_currency.toFixed(2)}%\n`;
      }
      
      // Add supply information
      result += `   Circulating Supply: ${formatSupply(coin.circulating_supply, coin.symbol)}\n`;
      
      if (coin.max_supply) {
        result += `   Max Supply: ${formatSupply(coin.max_supply, coin.symbol)}\n`;
      }
      
      // Add all-time high/low data
      result += `   ATH: ${formatNumber(coin.ath, inputs.vs_currency)} (${coin.ath_change_percentage.toFixed(2)}% from current)\n`;
      
      // Add last updated timestamp
      const lastUpdated = new Date(coin.last_updated);
      result += `   Last Updated: ${lastUpdated.toISOString()}\n\n`;
    });
    
    // Add pagination info
    result += `Page ${inputs.page} · ${data.length} results per page\n`;
    result += `Data from CoinGecko API`;
    
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
export class GetCoinsMarketDataAction implements ZapAction<typeof CoinsMarketDataSchema> {
  public name = "get_coins_market_data";
  public description = COINS_MARKET_DATA_PROMPT;
  public schema = CoinsMarketDataSchema;
  public config = CoinGeckoConfig.getInstance();
  public func = getCoinsMarketData;
}

// Export types for testing
export type CoinsMarketDataRequest = z.infer<typeof CoinsMarketDataSchema>; 