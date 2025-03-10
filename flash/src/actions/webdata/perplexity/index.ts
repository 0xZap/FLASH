import { ZapAction, ZapActionSchema } from "../../zap_action";
import { PerplexityChatAction } from "./chat_completions";
import { PerplexityConfig } from "../../../config/perplexity_config";

/**
 * Retrieves all Perplexity API action instances.
 * WARNING: All new Perplexity action classes must be instantiated here to be discovered.
 *
 * @returns - Array of Perplexity action instances
 */
export function getPerplexityActions(config?: PerplexityConfig): ZapAction<ZapActionSchema>[] {
  // If config is provided, ensure it's set as the instance
  if (config) {
    PerplexityConfig.resetInstance();
    PerplexityConfig.getInstance({ 
      apiKey: config.getApiKey() || undefined,
    });
  }

  return [
    new PerplexityChatAction() as unknown as ZapAction<ZapActionSchema>,
  ];
}

export const PERPLEXITY_ACTIONS = getPerplexityActions();

export {
  PerplexityConfig,
  PerplexityChatAction,
}; 