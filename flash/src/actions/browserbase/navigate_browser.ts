import { z } from "zod";
import { ZapAction } from "../zap_action";
import { Browserbase } from "@browserbasehq/sdk";
import { BrowserbaseConfig } from "./connect_browser";
import puppeteer from "puppeteer";

// Input schema for browser navigation
const NavigateBrowserSchema = z
  .object({
    session_id: z
      .string()
      .describe("The session ID from a previously created Browserbase session."),
    url: z
      .string()
      .url()
      .describe("The URL to navigate to."),
    wait_for_load: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to wait for the page to load (default: true)."),
    wait_time: z
      .number()
      .optional()
      .default(10000)
      .describe("Time to wait after navigation in milliseconds (default: 10000)."),
    take_screenshot: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to take a screenshot after navigation (default: false)."),
  })
  .strict();

const NAVIGATE_BROWSER_PROMPT = `
This tool navigates a Browserbase browser to a specified URL.

Required inputs:
- session_id: The session ID from a previously created Browserbase session
- url: The URL to navigate to (must be a valid URL with protocol)

Optional inputs:
- wait_for_load: Whether to wait for the page to load completely (default: true)
- wait_time: Time to wait after navigation in milliseconds (default: 10000)
- take_screenshot: Whether to take a screenshot after navigation (default: false)

Important notes:
- Requires a valid session ID from a previous connect_browserbase call
- The URL must include the protocol (http:// or https://)
- Returns information about the navigation and page title

Example usage:
\`\`\`
{
  "session_id": "sess_abc123",
  "url": "https://www.example.com",
  "wait_for_load": true,
  "wait_time": 5000,
  "take_screenshot": true
}
\`\`\`
`;

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
  public name = "navigate_browser";
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