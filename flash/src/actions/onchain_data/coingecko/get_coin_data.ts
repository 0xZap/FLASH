import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { CoinGeckoConfig } from "../../../config/coingecko_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the input parameters of the tool
 */
const CoinDataSchema = z.object({
  id: z.string().describe("The ID of the coin to fetch data for (e.g., 'bitcoin', 'ethereum')"),
  localization: z.boolean().optional().describe("Include localized data (default: false)"),
  tickers: z.boolean().optional().describe("Include ticker data (default: false)"),
  market_data: z.boolean().optional().describe("Include market data (default: true)"),
  community_data: z.boolean().optional().describe("Include community data (default: false)"),
  developer_data: z.boolean().optional().describe("Include developer data (default: false)"),
  sparkline: z.boolean().optional().describe("Include sparkline data (default: false)"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Description of what the tool does and how to use it
 */
const COIN_DATA_PROMPT = `
Get detailed data for a specific cryptocurrency by its ID.

This tool fetches comprehensive information about a cryptocurrency, including:
- Basic information (name, symbol, description)
- Market data (price, market cap, volume, etc.)
- Links (website, social media, etc.)
- Developer activity
- Community statistics

Example usage:
- Get detailed data for Bitcoin: \`{ "id": "bitcoin" }\`
- Get Ethereum data with community stats: \`{ "id": "ethereum", "community_data": true }\`
- Get Solana data with tickers: \`{ "id": "solana", "tickers": true }\`
`;

/**
 * Step 3: Implement Function
 * 
 * Function that fetches data from the CoinGecko API and formats the response
 */
export async function getCoinData(inputs: z.infer<typeof CoinDataSchema>): Promise<string> {
  const config = CoinGeckoConfig.getInstance();
  const apiUrl = config.getApiUrl();
  
  // Build query parameters
  const params = new URLSearchParams();
  if (inputs.localization !== undefined) params.append("localization", inputs.localization.toString());
  if (inputs.tickers !== undefined) params.append("tickers", inputs.tickers.toString());
  if (inputs.market_data !== undefined) params.append("market_data", inputs.market_data.toString());
  if (inputs.community_data !== undefined) params.append("community_data", inputs.community_data.toString());
  if (inputs.developer_data !== undefined) params.append("developer_data", inputs.developer_data.toString());
  if (inputs.sparkline !== undefined) params.append("sparkline", inputs.sparkline.toString());
  
  const url = `${apiUrl}/coins/${encodeURIComponent(inputs.id)}?${params.toString()}`;
  
  try {
    const headers: HeadersInit = {
      'accept': 'application/json',
    };
    
    // Add API key if available
    const apiKey = config.getApiKey();
    if (apiKey) {
      headers['x-cg-pro-api-key'] = apiKey;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return formatCoinData(data, inputs);
  } catch (error) {
    return `Error fetching coin data: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Helper function to format the coin data response
 */
function formatCoinData(data: any, inputs: z.infer<typeof CoinDataSchema>): string {
  let result = `# ${data.name} (${data.symbol.toUpperCase()})\n\n`;
  
  // Basic information
  result += `**ID:** ${data.id}\n`;
  if (data.hashing_algorithm) result += `**Hashing Algorithm:** ${data.hashing_algorithm}\n`;
  if (data.block_time_in_minutes) result += `**Block Time:** ${data.block_time_in_minutes} minutes\n`;
  if (data.genesis_date) result += `**Genesis Date:** ${data.genesis_date}\n`;
  
  // Categories
  if (data.categories && data.categories.length > 0) {
    result += `**Categories:** ${data.categories.join(', ')}\n`;
  }
  
  // Description
  if (data.description && data.description.en) {
    const description = data.description.en.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
    result += `\n## Description\n\n${description.substring(0, 500)}${description.length > 500 ? '...' : ''}\n`;
  }
  
  // Market data
  if (inputs.market_data !== false && data.market_data) {
    result += `\n## Market Data\n\n`;
    
    // Current price
    result += `**Current Price:** `;
    if (data.market_data.current_price) {
      const prices = data.market_data.current_price;
      result += `$${prices.usd?.toLocaleString() || 'N/A'} USD`;
      if (prices.eur) result += ` | €${prices.eur.toLocaleString()} EUR`;
      if (prices.btc && data.symbol.toLowerCase() !== 'btc') result += ` | ₿${prices.btc} BTC`;
      if (prices.eth && data.symbol.toLowerCase() !== 'eth') result += ` | Ξ${prices.eth} ETH`;
    }
    result += `\n`;
    
    // Market cap
    if (data.market_data.market_cap_rank) result += `**Market Cap Rank:** #${data.market_data.market_cap_rank}\n`;
    if (data.market_data.market_cap?.usd) result += `**Market Cap:** $${data.market_data.market_cap.usd.toLocaleString()} USD\n`;
    if (data.market_data.total_volume?.usd) result += `**24h Trading Volume:** $${data.market_data.total_volume.usd.toLocaleString()} USD\n`;
    
    // Supply
    if (data.market_data.circulating_supply) result += `**Circulating Supply:** ${data.market_data.circulating_supply.toLocaleString()} ${data.symbol.toUpperCase()}\n`;
    if (data.market_data.total_supply) result += `**Total Supply:** ${data.market_data.total_supply.toLocaleString()} ${data.symbol.toUpperCase()}\n`;
    if (data.market_data.max_supply) result += `**Max Supply:** ${data.market_data.max_supply.toLocaleString()} ${data.symbol.toUpperCase()}\n`;
    
    // Price changes
    if (data.market_data.price_change_percentage_24h) {
      result += `**24h Change:** ${data.market_data.price_change_percentage_24h.toFixed(2)}%\n`;
    }
    if (data.market_data.price_change_percentage_7d) {
      result += `**7d Change:** ${data.market_data.price_change_percentage_7d.toFixed(2)}%\n`;
    }
    if (data.market_data.price_change_percentage_30d) {
      result += `**30d Change:** ${data.market_data.price_change_percentage_30d.toFixed(2)}%\n`;
    }
    
    // ATH/ATL
    if (data.market_data.ath?.usd) {
      result += `**All-Time High:** $${data.market_data.ath.usd.toLocaleString()} USD`;
      if (data.market_data.ath_date?.usd) {
        result += ` (${new Date(data.market_data.ath_date.usd).toLocaleDateString()})`;
      }
      if (data.market_data.ath_change_percentage?.usd) {
        result += ` | ${data.market_data.ath_change_percentage.usd.toFixed(2)}% from ATH`;
      }
      result += `\n`;
    }
    
    if (data.market_data.atl?.usd) {
      result += `**All-Time Low:** $${data.market_data.atl.usd.toLocaleString()} USD`;
      if (data.market_data.atl_date?.usd) {
        result += ` (${new Date(data.market_data.atl_date.usd).toLocaleDateString()})`;
      }
      result += `\n`;
    }
  }
  
  // Links
  if (data.links) {
    result += `\n## Links\n\n`;
    
    if (data.links.homepage && data.links.homepage.length > 0 && data.links.homepage[0]) {
      result += `**Website:** ${data.links.homepage[0]}\n`;
    }
    
    if (data.links.blockchain_site && data.links.blockchain_site.length > 0 && data.links.blockchain_site[0]) {
      result += `**Explorer:** ${data.links.blockchain_site[0]}\n`;
    }
    
    if (data.links.subreddit_url) result += `**Reddit:** ${data.links.subreddit_url}\n`;
    if (data.links.twitter_screen_name) result += `**Twitter:** https://twitter.com/${data.links.twitter_screen_name}\n`;
    if (data.links.facebook_username) result += `**Facebook:** https://facebook.com/${data.links.facebook_username}\n`;
    if (data.links.telegram_channel_identifier) result += `**Telegram:** https://t.me/${data.links.telegram_channel_identifier}\n`;
    
    if (data.links.repos_url && data.links.repos_url.github && data.links.repos_url.github.length > 0) {
      result += `**GitHub:** ${data.links.repos_url.github[0]}\n`;
    }
  }
  
  // Community data
  if (inputs.community_data !== false && data.community_data) {
    result += `\n## Community Stats\n\n`;
    
    if (data.community_data.twitter_followers) {
      result += `**Twitter Followers:** ${data.community_data.twitter_followers.toLocaleString()}\n`;
    }
    
    if (data.community_data.reddit_subscribers) {
      result += `**Reddit Subscribers:** ${data.community_data.reddit_subscribers.toLocaleString()}\n`;
    }
    
    if (data.community_data.telegram_channel_user_count) {
      result += `**Telegram Members:** ${data.community_data.telegram_channel_user_count.toLocaleString()}\n`;
    }
  }
  
  // Developer data
  if (inputs.developer_data !== false && data.developer_data) {
    result += `\n## Developer Activity\n\n`;
    
    if (data.developer_data.forks) result += `**Forks:** ${data.developer_data.forks.toLocaleString()}\n`;
    if (data.developer_data.stars) result += `**Stars:** ${data.developer_data.stars.toLocaleString()}\n`;
    if (data.developer_data.subscribers) result += `**Watchers:** ${data.developer_data.subscribers.toLocaleString()}\n`;
    if (data.developer_data.total_issues) result += `**Total Issues:** ${data.developer_data.total_issues.toLocaleString()}\n`;
    if (data.developer_data.closed_issues) result += `**Closed Issues:** ${data.developer_data.closed_issues.toLocaleString()}\n`;
    if (data.developer_data.pull_requests_merged) result += `**PRs Merged:** ${data.developer_data.pull_requests_merged.toLocaleString()}\n`;
    if (data.developer_data.pull_request_contributors) result += `**Contributors:** ${data.developer_data.pull_request_contributors.toLocaleString()}\n`;
    
    if (data.developer_data.commit_count_4_weeks) {
      result += `**Commits (4 weeks):** ${data.developer_data.commit_count_4_weeks.toLocaleString()}\n`;
    }
  }
  
  // Tickers
  if (inputs.tickers && data.tickers && data.tickers.length > 0) {
    result += `\n## Top Markets\n\n`;
    
    // Sort tickers by volume
    const sortedTickers = [...data.tickers]
      .sort((a, b) => (b.converted_volume?.usd || 0) - (a.converted_volume?.usd || 0))
      .slice(0, 5); // Show top 5
    
    for (const ticker of sortedTickers) {
      result += `**${ticker.market.name}:** ${ticker.base}/${ticker.target} | `;
      result += `Last Price: $${ticker.converted_last?.usd?.toLocaleString() || 'N/A'} | `;
      result += `24h Volume: $${ticker.converted_volume?.usd?.toLocaleString() || 'N/A'}\n`;
    }
  }
  
  result += `\n*Last Updated: ${new Date(data.last_updated).toLocaleString()}*`;
  
  return result;
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetCoinDataAction implements ZapAction<typeof CoinDataSchema> {
  public name = "get_coin_data";
  public description = COIN_DATA_PROMPT;
  public schema = CoinDataSchema;
  public config = CoinGeckoConfig.getInstance();
  public func = getCoinData;
}

// Export types for testing
export type CoinDataRequest = z.infer<typeof CoinDataSchema>; 