import { z } from "zod";

export const CONNECT_BROWSERBASE_ACTION_NAME = "connect_browserbase";

export const ConnectBrowserbaseSchema = z
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

export const CONNECT_BROWSERBASE_PROMPT = `
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