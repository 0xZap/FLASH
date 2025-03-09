import { ZapAction, ZapActionSchema } from "../zap_action";
import { BrowserbaseConfig, ConnectBrowserbaseAction } from "./connect_browser";
import { NavigateBrowserAction } from "./navigate_browser";
import { StagehandBrowseAction } from "./stagehand_browse";
import { PuppeteerConnectAction } from "./puppeteer_connect";

/**
 * Retrieves all Browserbase action instances.
 * WARNING: All new Browserbase action classes must be instantiated here to be discovered.
 *
 * @returns - Array of Browserbase action instances
 */
export function getBrowserbaseActions(config?: BrowserbaseConfig): ZapAction<ZapActionSchema>[] {
  // If config is provided, ensure it's set as the instance
  if (config) {
    BrowserbaseConfig.resetInstance();
    BrowserbaseConfig.getInstance({ 
      apiKey: config.getApiKey() || undefined,
      projectId: config.getProjectId() || undefined
    });
  }

  return [
    new ConnectBrowserbaseAction() as unknown as ZapAction<ZapActionSchema>,
    new NavigateBrowserAction() as unknown as ZapAction<ZapActionSchema>,
    new StagehandBrowseAction() as unknown as ZapAction<ZapActionSchema>,
    new PuppeteerConnectAction() as unknown as ZapAction<ZapActionSchema>,
  ];
}

export const BROWSERBASE_ACTIONS = getBrowserbaseActions();

export {
  BrowserbaseConfig,
  ConnectBrowserbaseAction,
  NavigateBrowserAction,
  StagehandBrowseAction,
  PuppeteerConnectAction,
}; 