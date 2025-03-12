import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { CoinGeckoConfig } from "../../../config/coingecko_config";
import { GET_TOP_GAINERS_LOSERS_ACTION_NAME, TOP_GAINERS_LOSERS_PRO_PROMPT, TopGainersLosersProSchema } from "../../../actions_schemas/onchain_data/coingecko_pro/get_top_gainers_losers";

/**
 * Interface for CoinGecko Pro API response
 */
interface CoinGeckoProTopGainersLosersResponse {
  top_gainers: CoinDataPro[];
  top_losers: CoinDataPro[];
}

/**
 * Interface for individual coin data based on actual API response
 */
interface CoinDataPro {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank: number;
  usd?: number;                // Current price in USD
  usd_24h_vol?: number;        // 24h trading volume
  usd_1h_change?: number;      // 1h price change percentage
  usd_24h_change?: number;     // 24h price change percentage
  usd_7d_change?: number;      // 7d price change percentage
  usd_14d_change?: number;     // 14d price change percentage
  usd_30d_change?: number;     // 30d price change percentage
  usd_60d_change?: number;     // 60d price change percentage
  usd_1y_change?: number;      // 1y price change percentage
  [key: string]: any;          // For other currency fields (eur, jpy, etc.)
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches top gainers and losers from CoinGecko Pro API
 * @param inputs The parameters for the API request
 * @returns Formatted results of top gainers and losers
 */
export async function getTopGainersLosersPro(inputs: z.infer<typeof TopGainersLosersProSchema>): Promise<string> {
  // Get API configuration
  const config = CoinGeckoConfig.getInstance();
  
  // Check if Pro API key is available
  if (!config.hasProApiKey()) {
    return "This endpoint requires a CoinGecko Pro API key. Please set your API key in the configuration.";
  }
  
  // Get Pro API configuration
  const apiConfig = config.getProApiConfig();
  const endpoint = "/coins/top_gainers_losers";
  
  try {
    // Make API request using fetch
    const response = await fetch(`${apiConfig.url}${endpoint}`, {
      method: 'GET',
      headers: apiConfig.headers,
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return "API key invalid or unauthorized. This endpoint requires a paid CoinGecko plan.";
      }
      
      if (response.status === 429) {
        return "Rate limit exceeded. Please try again later.";
      }
      
      return `CoinGecko Pro API error: ${response.statusText}`;
    }
    
    const data = await response.json() as CoinGeckoProTopGainersLosersResponse;
    
    // Check if response contains data
    if (!data || (!data.top_gainers && !data.top_losers)) {
      return "No data returned from CoinGecko Pro API.";
    }
    
    // Get the appropriate percentage change field based on duration
    const percentageField = getDurationFieldPro(inputs.duration, inputs.vs_currency);
    
    // Format and limit results
    const topCount = Math.min(inputs.top_count, 30);
    const gainers = formatCoinListPro(data.top_gainers, percentageField, inputs.vs_currency, topCount);
    const losers = formatCoinListPro(data.top_losers, percentageField, inputs.vs_currency, topCount);
    
    // Build the response
    return `
📈 TOP ${topCount} GAINERS (${inputs.duration})
${gainers}

📉 TOP ${topCount} LOSERS (${inputs.duration})
${losers}

Data from CoinGecko Pro API, updated every 5 minutes.
Note: Only includes coins with 24h trading volume ≥ $50,000.
`;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `Error fetching data from CoinGecko Pro API: ${error.message}`;
    }
    
    return "Unknown error occurred while fetching data from CoinGecko Pro API.";
  }
}

/**
 * Helper function to get the appropriate percentage change field based on duration and currency
 */
function getDurationFieldPro(duration: string, currency: string = "usd"): string {
  const currencyLower = currency.toLowerCase();
  
  switch (duration) {
    case "1h":
      return `${currencyLower}_1h_change`;
    case "24h":
      return `${currencyLower}_24h_change`;
    case "7d":
      return `${currencyLower}_7d_change`;
    case "14d":
      return `${currencyLower}_14d_change`;
    case "30d":
      return `${currencyLower}_30d_change`;
    case "60d":
      return `${currencyLower}_60d_change`;
    case "1y":
      return `${currencyLower}_1y_change`;
    default:
      return `${currencyLower}_24h_change`;
  }
}

/**
 * Helper function to format a list of coins
 */
function formatCoinListPro(
  coins: CoinDataPro[],
  percentageField: string,
  currency: string = "usd",
  limit: number
): string {
  if (!coins || coins.length === 0) {
    return "No data available.";
  }
  
  // Sort coins by the specified percentage change field if available, otherwise by price
  const sortedCoins = [...coins].sort((a, b) => {
    // If the percentage field exists, use it for sorting
    if (a[percentageField] !== undefined && b[percentageField] !== undefined) {
      return Math.abs(b[percentageField] as number) - Math.abs(a[percentageField] as number);
    }
    
    // Fallback to sorting by 1y change if available
    const aChange = a[`${currency.toLowerCase()}_1y_change`] || 0;
    const bChange = b[`${currency.toLowerCase()}_1y_change`] || 0;
    return Math.abs(bChange) - Math.abs(aChange);
  });
  
  // Limit the number of results
  const limitedCoins = sortedCoins.slice(0, limit);
  
  // Format each coin's data
  return limitedCoins.map((coin, index) => {
    const currencyLower = currency.toLowerCase();
    const price = coin[currencyLower] || 0;
    const percentChange = coin[percentageField] || coin[`${currencyLower}_1y_change`] || 0;
    const formattedPercentage = percentChange.toFixed(2);
    const arrow = percentChange >= 0 ? "↗" : "↘";
    const volume = coin[`${currencyLower}_24h_vol`] || 0;
    
    return `${index + 1}. ${coin.name} (${coin.symbol.toUpperCase()})
   Price: ${price} ${currency.toUpperCase()}
   Change: ${arrow} ${formattedPercentage}%
   24h Volume: ${formatNumberPro(volume)}
   Rank: #${coin.market_cap_rank || 'N/A'}`;
  }).join("\n\n");
}

/**
 * Helper function to format large numbers
 */
function formatNumberPro(num: number): string {
  if (!num) return "N/A";
  
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  } else {
    return `$${num.toFixed(2)}`;
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetTopGainersLosersProAction implements ZapAction<typeof TopGainersLosersProSchema> {
  public name = "get_top_gainers_losers_pro";
  public description = TOP_GAINERS_LOSERS_PRO_PROMPT;
  public schema = TopGainersLosersProSchema;
  public config = CoinGeckoConfig.getInstance();
  public func = getTopGainersLosersPro;
}

// Export types for testing
export type TopGainersLosersProRequest = z.infer<typeof TopGainersLosersProSchema>; 