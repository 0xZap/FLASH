import { ZapAction, ZapActionSchema } from "../zap_action";
import { ExaConfig } from "../../config/exa_config";
import { ExaSearchAction } from "./exa_search";

/**
 * Retrieves all AI action instances.
 * WARNING: All new AI action classes must be instantiated here to be discovered.
 *
 * @param config - Optional Exa configuration
 * @returns Array of AI action instances
 */
export function getAIActions(config?: ExaConfig): ZapAction<ZapActionSchema>[] {
  // If config is provided, ensure it's set as the instance
  if (config) {
    ExaConfig.resetInstance();
    ExaConfig.getInstance({ apiKey: config.getApiKey() });
  }

  return [
    new ExaSearchAction(),
    // Add other AI tools here as they are implemented
  ];
}

export const EXA_ACTIONS = getAIActions();

export {
  ExaSearchAction,
}; 