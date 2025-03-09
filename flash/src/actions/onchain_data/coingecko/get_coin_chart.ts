import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { CoinGeckoConfig } from "../../../config/coingecko_config";
import { 
  formatCurrency, 
  formatLargeNumber, 
  formatDate,
  getCurrencySymbol,
  getTimeframeLabel,
  findSignificantPoints,
  getRequestHeaders
} from "./helpers";


/**
 * Step 1: Define Input Schema
 * 
 * Schema for the input parameters of the tool
 */
const CoinChartSchema = z.object({
  id: z.string().describe("The ID of the coin to fetch chart data for (e.g., 'bitcoin', 'ethereum')"),
  vs_currency: z.string().default("usd").describe("The target currency (e.g., 'usd', 'eur', 'btc')"),
  days: z.enum(["1", "7", "14", "30", "90", "180", "365", "max"]).default("30")
    .describe("Data up to number of days ago (1/7/14/30/90/180/365/max)"),
  interval: z.enum(["daily", "hourly"]).optional()
    .describe("Data interval. Possible values: daily, hourly (default: auto based on days)"),
});

/**
 * Step 2: Create Tool Prompt
 * 
 * Description of what the tool does and how to use it
 */
const COIN_CHART_PROMPT = `
Get historical chart data for a specific cryptocurrency by its ID.

This tool fetches price, market cap, and volume data over time for a cryptocurrency, suitable for charting.
The data is summarized in a text format with key statistics and trends.

Example usage:
- Get Bitcoin 30-day chart data in USD: \`{ "id": "bitcoin", "days": "30" }\`
- Get Ethereum 7-day chart data in EUR: \`{ "id": "ethereum", "vs_currency": "eur", "days": "7" }\`
- Get 1-year chart data with daily intervals: \`{ "id": "solana", "days": "365", "interval": "daily" }\`
`;

/**
 * Step 3: Implement Function
 * 
 * Function that fetches data from the CoinGecko API and formats the response
 */
export async function getCoinChart(inputs: z.infer<typeof CoinChartSchema>): Promise<string> {
  const config = CoinGeckoConfig.getInstance();
  const apiUrl = config.getApiUrl();
  
  // Build query parameters
  const params = new URLSearchParams();
  params.append("vs_currency", inputs.vs_currency);
  params.append("days", inputs.days);
  if (inputs.interval) params.append("interval", inputs.interval);
  
  const url = `${apiUrl}/coins/${encodeURIComponent(inputs.id)}/market_chart?${params.toString()}`;
  
  try {
    const headers = getRequestHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return formatChartData(data, inputs);
  } catch (error) {
    return `Error fetching chart data: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Helper function to format the chart data response
 */
function formatChartData(data: any, inputs: z.infer<typeof CoinChartSchema>): string {
  if (!data.prices || data.prices.length === 0) {
    return `No chart data found for ${inputs.id}.`;
  }
  
  const currencySymbol = getCurrencySymbol(inputs.vs_currency);
  const timeframe = getTimeframeLabel(inputs.days);
  
  let result = `# ${inputs.id.charAt(0).toUpperCase() + inputs.id.slice(1)} ${timeframe} Chart Data\n\n`;
  
  // Process price data
  const prices = data.prices.map((p: [number, number]) => p[1]);
  const timestamps = data.prices.map((p: [number, number]) => new Date(p[0]));
  
  // Calculate price statistics
  const currentPrice = prices[prices.length - 1];
  const startPrice = prices[0];
  const highPrice = Math.max(...prices);
  const lowPrice = Math.min(...prices);
  const priceChange = currentPrice - startPrice;
  const priceChangePercentage = (priceChange / startPrice) * 100;
  
  // Format price section
  result += `## Price (${currencySymbol.toUpperCase()})\n\n`;
  result += `**Current:** ${formatCurrency(currentPrice, inputs.vs_currency)}\n`;
  result += `**Start:** ${formatCurrency(startPrice, inputs.vs_currency)} (${formatDate(timestamps[0])})\n`;
  result += `**High:** ${formatCurrency(highPrice, inputs.vs_currency)}\n`;
  result += `**Low:** ${formatCurrency(lowPrice, inputs.vs_currency)}\n`;
  result += `**Change:** ${formatCurrency(priceChange, inputs.vs_currency)} (${priceChangePercentage.toFixed(2)}%)\n\n`;
  
  // Process market cap data if available
  if (data.market_caps && data.market_caps.length > 0) {
    const marketCaps = data.market_caps.map((m: [number, number]) => m[1]);
    const currentMarketCap = marketCaps[marketCaps.length - 1];
    const startMarketCap = marketCaps[0];
    const marketCapChange = currentMarketCap - startMarketCap;
    const marketCapChangePercentage = (marketCapChange / startMarketCap) * 100;
    
    result += `## Market Cap\n\n`;
    result += `**Current:** ${formatLargeNumber(currentMarketCap, inputs.vs_currency)}\n`;
    result += `**Start:** ${formatLargeNumber(startMarketCap, inputs.vs_currency)}\n`;
    result += `**Change:** ${formatLargeNumber(marketCapChange, inputs.vs_currency)} (${marketCapChangePercentage.toFixed(2)}%)\n\n`;
  }
  
  // Process volume data if available
  if (data.total_volumes && data.total_volumes.length > 0) {
    const volumes = data.total_volumes.map((v: [number, number]) => v[1]);
    const currentVolume = volumes[volumes.length - 1];
    const averageVolume = volumes.reduce((sum: number, vol: number) => sum + vol, 0) / volumes.length;
    const maxVolume = Math.max(...volumes);
    
    result += `## Trading Volume\n\n`;
    result += `**Current 24h:** ${formatLargeNumber(currentVolume, inputs.vs_currency)}\n`;
    result += `**Average 24h:** ${formatLargeNumber(averageVolume, inputs.vs_currency)}\n`;
    result += `**Highest 24h:** ${formatLargeNumber(maxVolume, inputs.vs_currency)}\n\n`;
  }
  
  // Add summary of key points in time
  result += `## Key Points\n\n`;
  
  // Find significant price movements
  const significantPoints = findSignificantPoints(data.prices, 5);
  
  for (const point of significantPoints) {
    const date = new Date(point.timestamp);
    result += `- **${formatDate(date)}:** Price ${point.isHigh ? 'peaked' : 'bottomed'} at ${formatCurrency(point.price, inputs.vs_currency)}\n`;
  }
  
  // Add data range info
  const startDate = new Date(data.prices[0][0]);
  const endDate = new Date(data.prices[data.prices.length - 1][0]);
  
  result += `\n*Data from ${formatDate(startDate)} to ${formatDate(endDate)}*\n`;
  result += `*Total data points: ${data.prices.length}*\n`;
  
  return result;
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetCoinChartAction implements ZapAction<typeof CoinChartSchema> {
  public name = "get_coin_chart";
  public description = COIN_CHART_PROMPT;
  public schema = CoinChartSchema;
  public config = CoinGeckoConfig.getInstance();
  public func = getCoinChart;
}

// Export types for testing
export type CoinChartRequest = z.infer<typeof CoinChartSchema>; 