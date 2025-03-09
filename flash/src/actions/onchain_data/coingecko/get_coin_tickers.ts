import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { CoinGeckoConfig } from "../../../config/coingecko_config";
import { formatNumber, formatLargeNumber } from "./helpers";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the input parameters of the tool
 */
const CoinTickersSchema = z.object({
  id: z.string().describe("The ID of the coin to fetch tickers for (e.g., 'bitcoin', 'ethereum')"),
  exchange_ids: z.string().optional().describe("Filter tickers by exchange IDs (comma-separated)"),
  include_exchange_logo: z.boolean().optional().describe("Include exchange logo URLs (default: false)"),
  page: z.number().optional().describe("Page number for paginated results (default: 1)"),
  order: z.enum(["trust_score_desc", "trust_score_asc", "volume_desc"]).optional()
    .describe("Order results by trust score or volume (default: trust_score_desc)"),
  depth: z.boolean().optional().describe("Include order book depth data (default: false)"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Description of what the tool does and how to use it
 */
const COIN_TICKERS_PROMPT = `
Get trading tickers for a specific cryptocurrency by its ID.

This tool fetches trading pairs, prices, and volume information from various exchanges for a specific cryptocurrency.

Example usage:
- Get Bitcoin tickers: \`{ "id": "bitcoin" }\`
- Get Ethereum tickers from specific exchanges: \`{ "id": "ethereum", "exchange_ids": "binance,coinbase" }\`
- Get tickers sorted by volume: \`{ "id": "solana", "order": "volume_desc" }\`
`;

/**
 * Step 3: Implement Function
 * 
 * Function that fetches data from the CoinGecko API and formats the response
 */
export async function getCoinTickers(inputs: z.infer<typeof CoinTickersSchema>): Promise<string> {
  const config = CoinGeckoConfig.getInstance();
  const apiUrl = config.getApiUrl();
  
  // Build query parameters
  const params = new URLSearchParams();
  if (inputs.exchange_ids) params.append("exchange_ids", inputs.exchange_ids);
  if (inputs.include_exchange_logo !== undefined) params.append("include_exchange_logo", inputs.include_exchange_logo.toString());
  if (inputs.page) params.append("page", inputs.page.toString());
  if (inputs.order) params.append("order", inputs.order);
  if (inputs.depth !== undefined) params.append("depth", inputs.depth.toString());
  
  const url = `${apiUrl}/coins/${encodeURIComponent(inputs.id)}/tickers?${params.toString()}`;
  
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
    return formatTickersData(data, inputs);
  } catch (error) {
    return `Error fetching coin tickers: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Helper function to format the tickers data response
 */
function formatTickersData(data: any, inputs: z.infer<typeof CoinTickersSchema>): string {
  if (!data.tickers || data.tickers.length === 0) {
    return `No tickers found for ${inputs.id}.`;
  }
  
  const coinName = data.name || inputs.id;
  let result = `# ${coinName} Trading Pairs\n\n`;
  
  // Summary
  result += `Found ${data.tickers.length} trading pairs across ${countUniqueExchanges(data.tickers)} exchanges.\n\n`;
  
  // Group tickers by exchange
  const exchangeGroups = groupTickersByExchange(data.tickers);
  
  // Sort exchanges by total volume
  const sortedExchanges = Object.entries(exchangeGroups)
    .sort((a, b) => b[1].totalVolumeUsd - a[1].totalVolumeUsd);
  
  // Display top exchanges and their tickers
  for (const [exchangeName, exchangeData] of sortedExchanges) {
    result += `## ${exchangeName}\n\n`;
    
    if (exchangeData.tickers.length > 0) {
      // Table header
      result += `| Pair | Price | 24h Volume | Spread | Last Updated |\n`;
      result += `|------|-------|------------|--------|---------------|\n`;
      
      // Sort tickers by volume
      const sortedTickers = [...exchangeData.tickers]
        .sort((a, b) => (b.converted_volume?.usd || 0) - (a.converted_volume?.usd || 0));
      
      // Table rows
      for (const ticker of sortedTickers) {
        const price = ticker.converted_last?.usd 
          ? `$${formatNumber(ticker.converted_last.usd)}` 
          : ticker.last 
            ? ticker.last 
            : 'N/A';
        
        const volume = ticker.converted_volume?.usd 
          ? `$${formatLargeNumber(ticker.converted_volume.usd)}` 
          : 'N/A';
        
        const spread = ticker.bid_ask_spread_percentage 
          ? `${ticker.bid_ask_spread_percentage.toFixed(2)}%` 
          : 'N/A';
        
        const lastUpdated = ticker.last_traded_at 
          ? new Date(ticker.last_traded_at).toLocaleString() 
          : 'N/A';
        
        result += `| ${ticker.base}/${ticker.target} | ${price} | ${volume} | ${spread} | ${lastUpdated} |\n`;
      }
      
      result += `\n**Total 24h Volume:** $${formatLargeNumber(exchangeData.totalVolumeUsd)}\n\n`;
    }
  }
  
  // Add pagination info if available
  if (data.page) {
    result += `\n*Page ${data.page} of ${data.total_pages || '?'} | `;
    result += `Total items: ${data.total || data.tickers.length}*\n`;
  }
  
  return result;
}

/**
 * Helper function to count unique exchanges
 */
function countUniqueExchanges(tickers: any[]): number {
  const exchangeSet = new Set();
  tickers.forEach(ticker => {
    if (ticker.market && ticker.market.name) {
      exchangeSet.add(ticker.market.name);
    }
  });
  return exchangeSet.size;
}

/**
 * Helper function to group tickers by exchange
 */
function groupTickersByExchange(tickers: any[]): Record<string, { tickers: any[], totalVolumeUsd: number }> {
  const groups: Record<string, { tickers: any[], totalVolumeUsd: number }> = {};
  
  tickers.forEach(ticker => {
    if (ticker.market && ticker.market.name) {
      const exchangeName = ticker.market.name;
      
      if (!groups[exchangeName]) {
        groups[exchangeName] = { tickers: [], totalVolumeUsd: 0 };
      }
      
      groups[exchangeName].tickers.push(ticker);
      groups[exchangeName].totalVolumeUsd += ticker.converted_volume?.usd || 0;
    }
  });
  
  return groups;
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetCoinTickersAction implements ZapAction<typeof CoinTickersSchema> {
  public name = "get_coin_tickers";
  public description = COIN_TICKERS_PROMPT;
  public schema = CoinTickersSchema;
  public config = CoinGeckoConfig.getInstance();
  public func = getCoinTickers;
}

// Export types for testing
export type CoinTickersRequest = z.infer<typeof CoinTickersSchema>; 