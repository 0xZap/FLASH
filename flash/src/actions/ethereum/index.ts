import { z } from "zod";
import { ZapAction, ZapActionSchema } from "../zap_action";
import { EthereumConfig } from "../../config/ethereum_config";
import { TransferAction } from "./transfer";

/**
 * Retrieves all Ethereum action instances.
 * WARNING: All new Ethereum action classes must be instantiated here to be discovered.
 *
 * @returns - Array of Ethereum action instances
 */
export function getEthereumActions(config?: EthereumConfig): ZapAction<ZapActionSchema>[] {
  // If config is provided, ensure it's set as the instance
  if (config) {
    EthereumConfig.resetInstance();
    EthereumConfig.getInstance({ privateKey: config.getPrivateKey() });
  }

  return [
    new TransferAction(),
  ];
}

export const ETHEREUM_ACTIONS = getEthereumActions();

export {
  TransferAction,
};