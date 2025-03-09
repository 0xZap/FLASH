import { ZapAction, ZapActionSchema } from "../../zap_action";
import { AlchemyConfig } from "../../../config/alchemy_config";

// Price APIs
import { GetTokenPricesAction } from "./get_token_prices";
import { GetTokenPricesByAddressAction } from "./get_token_prices_by_address";
import { GetHistoricalTokenPricesAction } from "./get_historical_token_prices";

// Token APIs
import { GetTokenBalancesAction } from "./get_token_balances";
import { GetTokenMetadataAction } from "./get_token_metadata";
import { GetTokenAllowanceAction } from "./get_token_allowance";

// Transaction APIs
import { GetTransactionsByAddressAction } from "./get_transactions_by_address";
import { GetTransactionAction } from "./get_transaction";

// Ethereum RPC APIs
import { GetBlockNumberAction } from "./get_block_number";
import { GetEthBalanceAction } from "./get_eth_balance";
import { GetLogsAction } from "./get_logs";
import { GetChainIdAction } from "./get_chain_id";
import { GetBlockAction } from "./get_block";
import { GetAccountsAction } from "./get_accounts";
import { GetFeeHistoryAction } from "./get_fee_history";
import { EstimateGasAction } from "./estimate_gas";
import { GetGasPriceAction } from "./get_gas_price";

/**
 * Retrieves all Alchemy action instances.
 * WARNING: All new Alchemy action classes must be instantiated here to be discovered.
 *
 * @param config - Optional Alchemy configuration
 * @returns Array of Alchemy action instances
 */
export function getAlchemyActions(config?: AlchemyConfig): ZapAction<ZapActionSchema>[] {
  // If config is provided, ensure it's set as the instance
  if (config) {
    AlchemyConfig.resetInstance();
    AlchemyConfig.getInstance({ apiKey: config.getApiKey() });
  }

  return [
    // Price related tools
    new GetTokenPricesAction(),
    new GetTokenPricesByAddressAction(),
    new GetHistoricalTokenPricesAction(),
    
    // Token related tools
    new GetTokenBalancesAction(),
    new GetTokenMetadataAction(),
    new GetTokenAllowanceAction(),
    
    // Transaction related tools
    new GetTransactionsByAddressAction(),
    new GetTransactionAction(),
    
    // Ethereum RPC tools - Basic blockchain state
    new GetBlockNumberAction(),
    new GetEthBalanceAction(),
    new GetChainIdAction(),
    new GetBlockAction(),
    
    // Ethereum RPC tools - Advanced blockchain state
    new GetAccountsAction(),
    new GetFeeHistoryAction(),
    
    // Ethereum RPC tools - Gas-related
    new GetGasPriceAction(),
    new EstimateGasAction(),
    
    // Ethereum RPC tools - Logging and events
    new GetLogsAction(),
    
    // Add other Alchemy tools here as they are implemented
  ];
}

export const ALCHEMY_ACTIONS = getAlchemyActions();

// Export all action classes
export {
  // Price APIs
  GetTokenPricesAction,
  GetTokenPricesByAddressAction,
  GetHistoricalTokenPricesAction,
  
  // Token APIs
  GetTokenBalancesAction,
  GetTokenMetadataAction,
  GetTokenAllowanceAction,
  
  // Transaction APIs
  GetTransactionsByAddressAction,
  GetTransactionAction,
  
  // Ethereum RPC APIs - Basic blockchain state
  GetBlockNumberAction,
  GetEthBalanceAction,
  GetChainIdAction,
  GetBlockAction,
  
  // Ethereum RPC tools - Advanced blockchain state
  GetAccountsAction,
  GetFeeHistoryAction,
  
  // Ethereum RPC tools - Gas-related
  GetGasPriceAction,
  EstimateGasAction,
  
  // Ethereum RPC tools - Logging and events
  GetLogsAction,
}; 