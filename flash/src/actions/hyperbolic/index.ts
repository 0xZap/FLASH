import { ZapAction, ZapActionSchema } from "../zap_action";
import { HyperbolicConfig } from "../../config/hyperbolic_config";
import { getAvailableGpusAction } from "./get_available_gpus";
import { getCurrentBalanceAction } from "./get_current_balance";
import { getGpuStatusAction } from "./get_gpu_status";
import { getSpendHistoryAction } from "./get_spend_history";
import { LinkWalletAddressAction } from "./link_wallet_address";
import { RemoteShellAction } from "./remote_shell";
import { RentComputeAction } from "./rent_compute";
import { SSHAccessAction } from "./ssh_access";
import { TerminateComputeAction } from "./terminate_compute";

/**
 * Retrieves all Hyperbolic action instances.
 * WARNING: All new Hyperbolic action classes must be instantiated here to be discovered.
 *
 * @returns - Array of Hyperbolic action instances
 */
export function getHyperbolicActions(config?: HyperbolicConfig): ZapAction<ZapActionSchema>[] {
  // If config is provided, ensure it's set as the instance
  if (config) {
    HyperbolicConfig.resetInstance();
    HyperbolicConfig.getInstance({ apiKey: config.getApiKey() });
  }

  return [
    new getAvailableGpusAction(),
    new getCurrentBalanceAction(),
    new getGpuStatusAction(),
    new getSpendHistoryAction(),
    new LinkWalletAddressAction(),
    new RemoteShellAction(),
    new RentComputeAction(),
    new SSHAccessAction(),
    new TerminateComputeAction(),
  ];
}

export const HYPERBOLIC_ACTIONS = getHyperbolicActions();

export {
  getAvailableGpusAction,
  getCurrentBalanceAction,
  getGpuStatusAction,
  getSpendHistoryAction,
  LinkWalletAddressAction,
  RemoteShellAction,
  RentComputeAction,
  SSHAccessAction,
  TerminateComputeAction,
}; 