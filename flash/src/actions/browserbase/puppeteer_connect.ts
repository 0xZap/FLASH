import { z } from "zod";
import { ZapAction } from "../zap_action";
import { Browserbase } from "@browserbasehq/sdk";
import { BrowserbaseConfig } from "./connect_browser";
import { PuppeteerConnectSchema, PUPPETEER_CONNECT_PROMPT, PUPPETEER_CONNECT_ACTION_NAME } from "../../actions_schemas/browserbase/puppeteer_connect";

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
  public name = PUPPETEER_CONNECT_ACTION_NAME;
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