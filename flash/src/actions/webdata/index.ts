import { ZapAction, ZapActionSchema } from "../zap_action";
import { PERPLEXITY_ACTIONS } from "./perplexity";
import { BROWSER_USE_TOOLS } from "./browser_use";

/**
 * Retrieves all web data action instances.
 * 
 * @returns - Array of web data action instances
 */
export function getWebDataActions(): ZapAction<ZapActionSchema>[] {
  return [
    ...PERPLEXITY_ACTIONS,
    ...BROWSER_USE_TOOLS,
    // Add other web data actions here as they are implemented
  ];
}

export const WEBDATA_ACTIONS = getWebDataActions();

export * from "./perplexity";
export * from "./browser_use"; 