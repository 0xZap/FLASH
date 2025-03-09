import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { CoinGeckoConfig } from "../../../config/coingecko_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the input parameters of the tool
 */
const CoinHistorySchema = z.object({
  id: z.string().describe("The ID of the coin to fetch historical data for (e.g., 'bitcoin', 'ethereum')"),
  date: z.string().describe("The date in DD-MM-YYYY format (e.g., '30-12-2020')"),
  localization: z.boolean().optional().describe("Include localized data (default: false)"),
});

/**
 * Step 2: Create Tool Prompt
 * 
 * Description of what the tool does and how to use it
 */
const COIN_HISTORY_PROMPT = `
Get historical data for a specific cryptocurrency by its ID on a specific date.

This tool fetches snapshot data for a cryptocurrency at a specific point in time, including:
- Price
- Market cap
- Volume
- Community data
- Developer data

Example usage:
- Get Bitcoin data from December 31, 2020: \`{ "id": "bitcoin", "date": "31-12-2020" }\`
- Get Ethereum data from January 1, 2021: \`{ "id": "ethereum", "date": "01-01-2021" }\`
`;

/**
 * Step 3: Implement Function
 * 
 * Function that fetches data from the CoinGecko API and formats the response
 */
export async function getCoinHistory(inputs: z.infer<typeof CoinHistorySchema>): Promise<string> {
  const config = CoinGeckoConfig.getInstance();
  const apiUrl = config.getApiUrl();
  
  // Validate date format (DD-MM-YYYY)
  if (!/^\d{2}-\d{2}-\d{4}$/.test(inputs.date)) {
    return "Error: Date must be in DD-MM-YYYY format (e.g., '31-12-2020')";
  }
  
  // Build query parameters
  const params = new URLSearchParams();
  params.append("date", inputs.date);
  if (inputs.localization !== undefined) params.append("localization", inputs.localization.toString());
  
  const url = `${apiUrl}/coins/${encodeURIComponent(inputs.id)}/history?${params.toString()}`;
  
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
    return formatHistoryData(data, inputs);
  } catch (error) {
    return `Error fetching coin history: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Helper function to format the historical data response
 */
function formatHistoryData(data: any, inputs: z.infer<typeof CoinHistorySchema>): string {
  if (!data.id) {
    return `No historical data found for ${inputs.id} on ${inputs.date}.`;
  }
  
  // Format date for display
  const [day, month, year] = inputs.date.split('-');
  const formattedDate = new Date(`${year}-${month}-${day}`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let result = `# ${data.name} (${data.symbol.toUpperCase()}) - ${formattedDate}\n\n`;
  
  // Market data
  if (data.market_data) {
    result += `## Market Data\n\n`;
    
    // Current price
    if (data.market_data.current_price) {
      result += `**Price:** `;
      const prices = data.market_data.current_price;
      
      if (prices.usd) result += `$${prices.usd.toLocaleString()} USD`;
      if (prices.eur) result += ` | €${prices.eur.toLocaleString()} EUR`;
      if (prices.btc && data.symbol.toLowerCase() !== 'btc') result += ` | ₿${prices.btc} BTC`;
      
      result += `\n`;
    }
    
    // Market cap
    if (data.market_data.market_cap) {
      result += `**Market Cap:** $${data.market_data.market_cap.usd?.toLocaleString() || 'N/A'} USD\n`;
    }
    
    // Volume
    if (data.market_data.total_volume) {
      result += `**24h Trading Volume:** $${data.market_data.total_volume.usd?.toLocaleString() || 'N/A'} USD\n`;
    }
  }
  
  // Community data
  if (data.community_data) {
    result += `\n## Community Stats\n\n`;
    
    if (data.community_data.twitter_followers) {
      result += `**Twitter Followers:** ${data.community_data.twitter_followers.toLocaleString()}\n`;
    }
    
    if (data.community_data.reddit_subscribers) {
      result += `**Reddit Subscribers:** ${data.community_data.reddit_subscribers.toLocaleString()}\n`;
    }
    
    if (data.community_data.reddit_average_posts_48h) {
      result += `**Reddit Posts (48h):** ${data.community_data.reddit_average_posts_48h}\n`;
    }
    
    if (data.community_data.reddit_average_comments_48h) {
      result += `**Reddit Comments (48h):** ${data.community_data.reddit_average_comments_48h}\n`;
    }
    
    if (data.community_data.reddit_accounts_active_48h) {
      result += `**Reddit Active Accounts (48h):** ${data.community_data.reddit_accounts_active_48h.toLocaleString()}\n`;
    }
  }
  
  // Developer data
  if (data.developer_data) {
    result += `\n## Developer Activity\n\n`;
    
    if (data.developer_data.forks) result += `**Forks:** ${data.developer_data.forks.toLocaleString()}\n`;
    if (data.developer_data.stars) result += `**Stars:** ${data.developer_data.stars.toLocaleString()}\n`;
    if (data.developer_data.subscribers) result += `**Watchers:** ${data.developer_data.subscribers.toLocaleString()}\n`;
    if (data.developer_data.total_issues) result += `**Total Issues:** ${data.developer_data.total_issues.toLocaleString()}\n`;
    if (data.developer_data.closed_issues) result += `**Closed Issues:** ${data.developer_data.closed_issues.toLocaleString()}\n`;
    if (data.developer_data.pull_requests_merged) result += `**PRs Merged:** ${data.developer_data.pull_requests_merged.toLocaleString()}\n`;
    if (data.developer_data.pull_request_contributors) result += `**Contributors:** ${data.developer_data.pull_request_contributors.toLocaleString()}\n`;
  }
  
  return result;
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetCoinHistoryAction implements ZapAction<typeof CoinHistorySchema> {
  public name = "get_coin_history";
  public description = COIN_HISTORY_PROMPT;
  public schema = CoinHistorySchema;
  public config = CoinGeckoConfig.getInstance();
  public func = getCoinHistory;
}

// Export types for testing
export type CoinHistoryRequest = z.infer<typeof CoinHistorySchema>; 