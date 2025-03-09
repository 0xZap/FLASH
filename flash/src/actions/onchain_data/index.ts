import { ALCHEMY_ACTIONS } from "./alchemy";
import { COINGECKO_ACTIONS } from "./coingecko";
import { COINGECKO_PRO_ACTIONS } from "./coingecko_pro";

export * from "./alchemy";
export * from "./coingecko";
export * from "./coingecko_pro";

// Combine all onchain data actions
export const ONCHAIN_DATA_ACTIONS = [
  ...ALCHEMY_ACTIONS,
  ...COINGECKO_ACTIONS,
  ...COINGECKO_PRO_ACTIONS
]; 