import { z } from "zod";

export const NAVIGATE_BROWSER_ACTION_NAME = "navigate_browser";

export const NavigateBrowserSchema = z
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

export const NAVIGATE_BROWSER_PROMPT = `
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