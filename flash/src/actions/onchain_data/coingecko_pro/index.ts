import { GetTopGainersLosersProAction } from "./get_top_gainers_losers";

// Export all CoinGecko Pro actions
export * from "./get_top_gainers_losers";

// Export array of all CoinGecko Pro actions for registration
export const COINGECKO_PRO_ACTIONS = [
  new GetTopGainersLosersProAction(),
]; 