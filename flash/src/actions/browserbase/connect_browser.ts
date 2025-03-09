import { z } from "zod";
import { ZapAction } from "../zap_action";
import { Browserbase } from "@browserbasehq/sdk";
import puppeteer from "puppeteer";

// Define the configuration class for Browserbase
export class BrowserbaseConfig {
  private static instance: BrowserbaseConfig | null = null;
  private apiKey: string | null = null;
  private projectId: string | null = null;

  private constructor(config?: { apiKey?: string; projectId?: string }) {
    if (config?.apiKey) {
      this.apiKey = config.apiKey;
    }
    if (config?.projectId) {
      this.projectId = config.projectId;
    }
  }

  public static getInstance(config?: { apiKey?: string; projectId?: string }): BrowserbaseConfig {
    if (!BrowserbaseConfig.instance) {
      BrowserbaseConfig.instance = new BrowserbaseConfig(config);
    } else if (config) {
      if (config.apiKey) {
        BrowserbaseConfig.instance.apiKey = config.apiKey;
      }
      if (config.projectId) {
        BrowserbaseConfig.instance.projectId = config.projectId;
      }
    }
    return BrowserbaseConfig.instance;
  }

  public static resetInstance(): void {
    BrowserbaseConfig.instance = null;
  }

  public getApiKey(): string | null {
    return this.apiKey || process.env.BROWSERBASE_API_KEY || null;
  }

  public getProjectId(): string | null {
    return this.projectId || process.env.BROWSERBASE_PROJECT_ID || null;
  }
}

// Input schema for connecting to Browserbase
const ConnectBrowserbaseSchema = z
  .object({
    project_id: z
      .string()
      .optional()
      .describe("The Browserbase project ID. If not provided, uses the configured default."),
    session_name: z
      .string()
      .optional()
      .describe("Optional name for the session for easier identification."),
    timeout: z
      .number()
      .optional()
      .default(60000)
      .describe("Timeout in milliseconds for the connection (default: 60000)"),
  })
  .strict();

const CONNECT_BROWSERBASE_PROMPT = `
This tool creates and connects to a new Browserbase session.

Optional inputs:
- project_id: The Browserbase project ID (if not provided, uses the configured default)
- session_name: Optional name for the session for easier identification
- timeout: Timeout in milliseconds for the connection (default: 60000)

Important notes:
- Requires a valid Browserbase API key to be configured
- Returns a session ID that can be used for browser automation
- The browser will be launched in the cloud, not locally

Example usage:
To create a new session in the default project:
\`\`\`
{
  "session_name": "My web automation session"
}
\`\`\`

To create a session in a specific project:
\`\`\`
{
  "project_id": "proj_abc123",
  "session_name": "Product research",
  "timeout": 120000
}
\`\`\`
`;

/**
 * Creates a new Browserbase session and connects to it.
 * @param params Connection parameters
 * @returns Information about the created session
 */
export async function connectBrowserbase(params: z.infer<typeof ConnectBrowserbaseSchema>): Promise<string> {
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
    
    const browser = await puppeteer.connect({
      browserWSEndpoint: session.connectUrl,
    });
    
    const pages = await browser.pages();
    console.log(`Connected to ${pages.length} pages`);
    return `Successfully connected to Browserbase:
- Session ID: ${session.id}
- Project ID: ${projectId}
${params.session_name ? `- Session Name: ${params.session_name}` : ''}
- Status: Connected
- Created At: ${new Date().toISOString()}

Use this session ID for further browser automation operations.`;
  } catch (error: any) {
    throw new Error(`Failed to connect to Browserbase: ${error.message}`);
  }
}

/**
 * Action to connect to a Browserbase session.
 */
export class ConnectBrowserbaseAction implements ZapAction<typeof ConnectBrowserbaseSchema> {
  public name = "connect_browserbase";
  public description = CONNECT_BROWSERBASE_PROMPT;
  public schema = ConnectBrowserbaseSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return connectBrowserbase({
      project_id: args.project_id,
      session_name: args.session_name,
      timeout: args.timeout !== undefined ? args.timeout : 60000,
    });
  };
} 