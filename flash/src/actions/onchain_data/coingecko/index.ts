import { GetCoinPricesAction } from "./get_coin_prices";
import { GetCoinsListAction } from "./get_coins_list";
import { GetTrendingCoinsAction } from "./get_trending_coins";
import { GetCoinDataAction } from "./get_coin_data";
import { GetCoinChartAction } from "./get_coin_chart";
import { GetCoinHistoryAction } from "./get_coin_history";
import { GetCoinTickersAction } from "./get_coin_tickers";
import { GetCoinsMarketsAction } from "./get_coins_markets";
import { GetCoinsMarketDataAction } from "./get_coins_market_data";

// Export all CoinGecko actions
export * from "./get_coin_prices";
export * from "./get_coins_list";
export * from "./get_trending_coins";
export * from "./get_coin_data";
export * from "./get_coin_chart";
export * from "./get_coin_history";
export * from "./get_coin_tickers";
export * from "./get_coins_markets";
export * from "./get_coins_market_data";

// Export helper functions
export * from "./helpers";

// Export array of all CoinGecko actions for registration
export const COINGECKO_ACTIONS = [
  new GetCoinPricesAction(),
  new GetCoinsListAction(),
  new GetTrendingCoinsAction(),
  new GetCoinDataAction(),
  new GetCoinChartAction(),
  new GetCoinHistoryAction(),
  new GetCoinTickersAction(),
  new GetCoinsMarketsAction(),
  new GetCoinsMarketDataAction()
];
