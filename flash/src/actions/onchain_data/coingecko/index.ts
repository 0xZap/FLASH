import { GetCoinPricesAction } from "./get_coin_prices";
import { GetCoinsListAction } from "./get_coins_list";
import { GetTrendingCoinsAction } from "./get_trending_coins";

// Export all CoinGecko actions
export * from "./get_coin_prices";
export * from "./get_coins_list";
export * from "./get_trending_coins";

// Export array of all CoinGecko actions for registration
export const COINGECKO_ACTIONS = [
  new GetCoinPricesAction(),
  new GetCoinsListAction(),
  new GetTrendingCoinsAction(),
];
