import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { CoinGeckoConfig } from "../../../config/coingecko_config";
import { GET_TRENDING_COINS_ACTION_NAME, TRENDING_COINS_PROMPT, TrendingCoinsSchema } from "../../../actions_schemas/onchain_data/coingecko/get_trending_coins";

/**
 * Interface for CoinGecko API response
 */
interface TrendingCoinsResponse {
  coins: {
    item: {
      id: string;
      coin_id: number;
      name: string;
      symbol: string;
      market_cap_rank: number;
      thumb: string;
      small: string;
      large: string;
      slug: string;
      price_btc: number;
      score: number;
      data?: {
        price?: string;
        price_btc?: string;
        price_change_percentage_24h?: Record<string, number>;
        market_cap?: string;
        market_cap_btc?: string;
        total_volume?: string;
        total_volume_btc?: string;
        sparkline?: string;
        content?: {
          title?: string;
          description?: string;
        } | null;
      };
    };
  }[];
  nfts: {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    nft_contract_id: number;
    native_currency_symbol: string;
    floor_price_in_native_currency: number;
    floor_price_24h_percentage_change: number;
    data?: {
      floor_price?: string;
      floor_price_in_usd_24h_percentage_change?: string;
      h24_volume?: string;
      h24_average_sale_price?: string;
      sparkline?: string;
      content?: any;
    };
  }[];
  categories: {
    id: number;
    name: string;
    market_cap_1h_change: number;
    slug: string;
    coins_count: number;
    data?: {
      market_cap?: number;
      market_cap_btc?: number;
      total_volume?: number;
      total_volume_btc?: number;
      market_cap_change_percentage_24h?: Record<string, number>;
      sparkline?: string;
    };
  }[];
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches trending coins from CoinGecko
 * @returns Formatted results of trending coins
 */
export async function getTrendingCoins(): Promise<string> {
  // Get API configuration
  const config = CoinGeckoConfig.getInstance();
  const baseUrl = config.getBaseUrl();
  const endpoint = "/search/trending";
  
  try {
    // Add API key if available (for higher rate limits)
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    if (config.hasApiKey()) {
      headers['x-cg-api-key'] = config.getApiKey() as string;
    }
    
    // Make API request
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        return "Rate limit exceeded. Please try again later or use an API key for higher limits.";
      }
      
      return `CoinGecko API error: ${response.statusText}`;
    }
    
    const data = await response.json() as TrendingCoinsResponse;
    
    // Check if response contains data
    if (!data || !data.coins || data.coins.length === 0) {
      return "No trending coins data returned from CoinGecko API.";
    }
    
    // Format the results
    let result = "🔥 Top Trending on CoinGecko (Last 24 Hours):\n\n";
    
    // Process trending coins
    if (data.coins && data.coins.length > 0) {
      result += "TRENDING COINS:\n";
      
      data.coins.forEach((coin, index) => {
        const { item } = coin;
        
        result += `${index + 1}. ${item.name} (${item.symbol.toUpperCase()})\n`;
        result += `   ID: ${item.id}\n`;
        result += `   Market Cap Rank: #${item.market_cap_rank || 'N/A'}\n`;
        result += `   Price in BTC: ${item.price_btc.toFixed(8)} BTC\n`;
        
        // Add additional data if available
        if (item.data) {
          if (item.data.price) {
            result += `   Price: ${item.data.price}\n`;
          }
          
          if (item.data.market_cap) {
            result += `   Market Cap: ${item.data.market_cap}\n`;
          }
          
          if (item.data.total_volume) {
            result += `   24h Volume: ${item.data.total_volume}\n`;
          }
          
          // Add description if available
          if (item.data.content && item.data.content.description) {
            const description = item.data.content.description;
            // Truncate description if too long
            const truncatedDescription = description.length > 100 
              ? description.substring(0, 100) + '...' 
              : description;
            result += `   Description: ${truncatedDescription}\n`;
          }
        }
        
        result += "\n";
      });
    }
    
    // Process trending NFTs
    if (data.nfts && data.nfts.length > 0) {
      result += "TRENDING NFTs:\n";
      
      data.nfts.slice(0, 3).forEach((nft, index) => {
        result += `${index + 1}. ${nft.name} (${nft.symbol})\n`;
        result += `   ID: ${nft.id}\n`;
        result += `   Currency: ${nft.native_currency_symbol.toUpperCase()}\n`;
        result += `   Floor Price: ${nft.floor_price_in_native_currency} ${nft.native_currency_symbol.toUpperCase()}\n`;
        result += `   24h Change: ${nft.floor_price_24h_percentage_change.toFixed(2)}%\n\n`;
      });
    }
    
    // Process trending categories
    if (data.categories && data.categories.length > 0) {
      result += "TRENDING CATEGORIES:\n";
      
      data.categories.slice(0, 3).forEach((category, index) => {
        result += `${index + 1}. ${category.name}\n`;
        result += `   Coins Count: ${category.coins_count}\n`;
        result += `   1h Market Cap Change: ${category.market_cap_1h_change.toFixed(2)}%\n`;
        
        if (category.data && category.data.market_cap) {
          result += `   Market Cap: $${(category.data.market_cap / 1_000_000_000).toFixed(2)}B\n`;
        }
        
        result += "\n";
      });
    }
    
    result += "Based on user search trends and market activity in the last 24 hours.";
    
    return result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `Error fetching trending coins: ${error.message}`;
    }
    
    return "Unknown error occurred while fetching trending coins from CoinGecko.";
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetTrendingCoinsAction implements ZapAction<typeof TrendingCoinsSchema> {
  public name = GET_TRENDING_COINS_ACTION_NAME;
  public description = TRENDING_COINS_PROMPT;
  public schema = TrendingCoinsSchema;
  public config = CoinGeckoConfig.getInstance();
  public func = getTrendingCoins;
}

// Export types for testing
export type TrendingCoinsRequest = z.infer<typeof TrendingCoinsSchema>; 