import { z } from "zod";
import { ZapAction } from "../zap_action";
import { Browserbase } from "@browserbasehq/sdk";
import { BrowserbaseConfig } from "./connect_browser";

// Input schema for Puppeteer connection
const PuppeteerConnectSchema = z
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

const PUPPETEER_CONNECT_PROMPT = `
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

/**
 * Creates a Browserbase session for Puppeteer connection.
 * @param params Connection parameters
 * @returns Information about the created session including connection URL
 */
export async function puppeteerConnect(params: z.infer<typeof PuppeteerConnectSchema>): Promise<string> {
  const config = BrowserbaseConfig.getInstance();
  const apiKey = config.getApiKey();
  const defaultProjectId = config.getProjectId();
  
  if (!apiKey) {
    throw new Error("Browserbase API key not found. Please set it in your configuration or as BROWSERBASE_API_KEY environment variable.");
  }
  
  const projectId = params.project_id || defaultProjectId;
  
  if (!projectId) {
    throw new Error("Browserbase project ID not found. Please provide it in the parameters or set it in your configuration or as BROWSERBASE_PROJECT_ID environment variable.");
  }

  try {
    // Initialize Browserbase SDK
    const bb = new Browserbase({ apiKey });

    // Create a session
    const sessionOptions: any = {
      projectId
    };
    
    if (params.session_name) {
      sessionOptions.name = params.session_name;
    }
    
    const session = await bb.sessions.create(sessionOptions);
    
    const replayUrl = `https://browserbase.com/sessions/${session.id}`;
    
    let result = `Successfully created Browserbase session for Puppeteer:
- Session ID: ${session.id}
- Project ID: ${projectId}
${params.session_name ? `- Session Name: ${params.session_name}` : ''}
- Replay URL: ${replayUrl}
- Created At: ${new Date().toISOString()}`;

    // Include the connection URL if requested
    if (params.return_connect_url) {
      result += `\n- Connect URL: ${session.connectUrl}

Use this URL with Puppeteer:
\`\`\`javascript
const browser = await puppeteer.connect({
  browserWSEndpoint: "${session.connectUrl}"
});
\`\`\``;
    }
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to create Puppeteer session: ${error.message}`);
  }
}

/**
 * Action to create a Browserbase session for Puppeteer connection.
 */
export class PuppeteerConnectAction implements ZapAction<typeof PuppeteerConnectSchema> {
  public name = "puppeteer_connect";
  public description = PUPPETEER_CONNECT_PROMPT;
  public schema = PuppeteerConnectSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return puppeteerConnect({
      project_id: args.project_id,
      session_name: args.session_name,
      return_connect_url: args.return_connect_url !== undefined ? args.return_connect_url : true,
    });
  };
} 