import { z } from "zod";

export const PUPPETEER_CONNECT_ACTION_NAME = "puppeteer_connect";
export const PuppeteerConnectSchema = z
  .object({
    project_id: z
      .string()
      .optional()
      .describe("The Browserbase project ID. If not provided, uses the configured default."),
    session_name: z
      .string()
      .optional()
      .describe("Optional name for the session for easier identification."),
    return_connect_url: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to return the WebSocket connection URL for Puppeteer (default: true)."),
  })
  .strict();

export const PUPPETEER_CONNECT_PROMPT = `
This tool creates a Browserbase session optimized for Puppeteer connection.

Optional inputs:
- project_id: The Browserbase project ID (if not provided, uses the configured default)
- session_name: Optional name for the session for easier identification
- return_connect_url: Whether to return the WebSocket connection URL (default: true)

Important notes:
- Requires a valid Browserbase API key to be configured
- Returns session information including the WebSocket endpoint URL to use with puppeteer.connect()
- The browser will be launched in the cloud, not locally

Example usage:
\`\`\`
{
  "session_name": "My Puppeteer automation",
  "return_connect_url": true
}
\`\`\`

Use the returned connectUrl with Puppeteer like this:
\`\`\`
const browser = await puppeteer.connect({
  browserWSEndpoint: connectUrl
});
\`\`\`
`;