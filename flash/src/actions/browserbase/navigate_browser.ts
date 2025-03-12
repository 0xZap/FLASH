import { z } from "zod";
import { ZapAction } from "../zap_action";
import { Browserbase } from "@browserbasehq/sdk";
import { BrowserbaseConfig } from "./connect_browser";
import puppeteer from "puppeteer";
import { NavigateBrowserSchema, NAVIGATE_BROWSER_PROMPT, NAVIGATE_BROWSER_ACTION_NAME } from "../../actions_schemas/browserbase/navigate_browser";
/**
 * Navigates a Browserbase browser to the specified URL.
 * @param params Navigation parameters
 * @returns Information about the navigation
 */
export async function navigateBrowser(params: z.infer<typeof NavigateBrowserSchema>): Promise<string> {
  const config = BrowserbaseConfig.getInstance();
  const apiKey = config.getApiKey();
  
  if (!apiKey) {
    throw new Error("Browserbase API key not found. Please set it in your configuration or as BROWSERBASE_API_KEY environment variable.");
  }

  try {
    // Initialize Browserbase SDK
    const bb = new Browserbase({ apiKey });
    
    // For TypeScript, let's declare an 'any' type to avoid compilation errors
    const browser: any = await puppeteer.connect({
      browserWSEndpoint: params.session_id,
    });
    
    // Create a new page/tab in the browser
    const page = await browser.newPage();
    
    // Navigate to the URL
    const navigationOptions: any = {};
    
    if (params.wait_for_load) {
      navigationOptions.waitUntil = 'networkidle';
    }
    
    if (params.wait_time) {
      navigationOptions.timeout = params.wait_time;
    }
    
    await page.goto(params.url, navigationOptions);
    
    // Wait additional time if specified
    if (params.wait_time > 0) {
      await page.waitForTimeout(params.wait_time);
    }
    
    // Get page title
    const title = await page.title();
    
    // Take screenshot if requested
    let screenshotInfo = "";
    if (params.take_screenshot) {
      const screenshotPath = `browserbase_screenshot_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath });
      screenshotInfo = `\nA screenshot was taken and saved to: ${screenshotPath}`;
    }
    
    // Get current URL (might be different after redirects)
    const finalUrl = page.url();
    
    return `Successfully navigated browser:
- Session ID: ${params.session_id}
- Navigated to: ${params.url}
- Final URL: ${finalUrl}
- Page Title: ${title}
- Wait Time: ${params.wait_time}ms${screenshotInfo}`;
  } catch (error: any) {
    throw new Error(`Failed to navigate browser: ${error.message}`);
  }
}

/**
 * Action to navigate a Browserbase browser to a specific URL.
 */
export class NavigateBrowserAction implements ZapAction<typeof NavigateBrowserSchema> {
  public name = NAVIGATE_BROWSER_ACTION_NAME;
  public description = NAVIGATE_BROWSER_PROMPT;
  public schema = NavigateBrowserSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return navigateBrowser({
      session_id: args.session_id,
      url: args.url,
      wait_for_load: args.wait_for_load !== undefined ? args.wait_for_load : true,
      wait_time: args.wait_time || 10000,
      take_screenshot: args.take_screenshot !== undefined ? args.take_screenshot : false,
    });
  };
} 