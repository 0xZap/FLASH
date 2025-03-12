import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { CoinGeckoConfig } from "../../../config/coingecko_config";
import { formatNumber, capitalizeFirstLetter, getRequestHeaders } from "./helpers";
import { CoinPricesSchema, COIN_PRICES_PROMPT, GET_COIN_PRICES_ACTION_NAME } from "../../../actions_schemas/onchain_data/coingecko/get_coin_prices";

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
  
  // Build URL parameters
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
  
  // Get headers using the helper function
  const headers = getRequestHeaders();
  
  // Make the API request
  try {
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
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetCoinPricesAction implements ZapAction<typeof CoinPricesSchema> {
  public name = GET_COIN_PRICES_ACTION_NAME;
  public description = COIN_PRICES_PROMPT;
  public schema = CoinPricesSchema;
  public config = CoinGeckoConfig.getInstance();
  public func = getCoinPrices;
}

// Export types for testing
export type CoinPricesRequest = z.infer<typeof CoinPricesSchema>; 