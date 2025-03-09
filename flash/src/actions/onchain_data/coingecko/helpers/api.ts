import { CoinGeckoConfig } from "../../../../config/coingecko_config";

/**
 * Get request headers for CoinGecko API calls
 */
export function getRequestHeaders(): HeadersInit {
  const config = CoinGeckoConfig.getInstance();
  const headers: HeadersInit = {
    'accept': 'application/json',
  };
  
  // Add API key if available
  const apiKey = config.getApiKey();
  if (apiKey) {
    headers['x-cg-pro-api-key'] = apiKey;
  }
  
  return headers;
}

/**
 * Find significant price points (highs and lows)
 */
export function findSignificantPoints(
  priceData: [number, number][], 
  maxPoints: number
): Array<{timestamp: number, price: number, isHigh: boolean}> {
  if (priceData.length <= 2) {
    return [];
  }
  
  const points: Array<{timestamp: number, price: number, isHigh: boolean}> = [];
  const prices = priceData.map(p => p[1]);
  const timestamps = priceData.map(p => p[0]);
  
  // Find local maxima and minima
  for (let i = 1; i < prices.length - 1; i++) {
    // Local maximum
    if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
      points.push({
        timestamp: timestamps[i],
        price: prices[i],
        isHigh: true
      });
    }
    // Local minimum
    else if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
      points.push({
        timestamp: timestamps[i],
        price: prices[i],
        isHigh: false
      });
    }
  }
  
  // Sort by significance (distance from average)
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  points.sort((a, b) => Math.abs(b.price - avgPrice) - Math.abs(a.price - avgPrice));
  
  // Return top N points
  return points.slice(0, maxPoints);
} 