import { z } from "zod";
import { ZapAction } from "../zap_action";
import { Stagehand } from "@browserbasehq/stagehand";
import { BrowserbaseConfig } from "./connect_browser";

// Input schema for Stagehand browsing
const StagehandBrowseSchema = z
  .object({
    url: z
      .string()
      .url()
      .describe("The URL to navigate to."),
    instruction: z
      .string()
      .describe("Instruction for Stagehand to perform (what you want it to do on the page)."),
    model_name: z
      .enum(["gpt-4o", "claude-3-5-sonnet-latest"])
      .default("gpt-4o")
      .describe("The AI model to use: 'gpt-4o' (OpenAI) or 'claude-3-5-sonnet-latest' (Anthropic)."),
    timeout: z
      .number()
      .optional()
      .default(60000)
      .describe("Timeout in milliseconds for the operation (default: 60000)."),
    extract_data: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to extract data using the instruction (default: false)."),
    extract_schema: z
      .string()
      .optional()
      .describe("JSON schema for extracted data (only used if extract_data is true)."),
  })
  .strict();

const STAGEHAND_BROWSE_PROMPT = `
This tool performs automated browsing using Stagehand with Browserbase.

Required inputs:
- url: The URL to navigate to
- instruction: The instruction for Stagehand to perform (e.g., "Find the pricing page and extract the monthly price")

Optional inputs:
- model_name: The AI model to use - "gpt-4o" for OpenAI (default) or "claude-3-5-sonnet-latest" for Anthropic
- timeout: Timeout in milliseconds (default: 60000)
- extract_data: Whether to extract data using the instruction (default: false)
- extract_schema: JSON schema for extracted data (only used if extract_data is true)

Important notes:
- Requires valid API keys for both Browserbase and the chosen AI model (OpenAI or Anthropic)
- If using OpenAI, set the OPENAI_API_KEY environment variable
- If using Anthropic, set the ANTHROPIC_API_KEY environment variable
- The instruction should be a clear, natural language task that describes what to do on the page

Example usage:
\`\`\`
{
  "url": "https://docs.browserbase.com",
  "instruction": "Find the Getting Started section and extract the installation command",
  "model_name": "gpt-4o",
  "extract_data": true,
  "extract_schema": "{ \\"installCommand\\": \\"string\\" }"
}
\`\`\`
`;

/**
 * Uses Stagehand with Browserbase to automate a browser and perform tasks.
 * @param params The Stagehand parameters
 * @returns Information about the browsing operation and any extracted data
 */
export async function stagehandBrowse(params: z.infer<typeof StagehandBrowseSchema>): Promise<string> {
  const config = BrowserbaseConfig.getInstance();
  const apiKey = config.getApiKey();
  const projectId = config.getProjectId();
  
  if (!apiKey) {
    throw new Error("Browserbase API key not found. Please set it in your configuration or as BROWSERBASE_API_KEY environment variable.");
  }
  
  if (!projectId) {
    throw new Error("Browserbase project ID not found. Please set it in your configuration or as BROWSERBASE_PROJECT_ID environment variable.");
  }
  
  // Check for required API keys based on the selected model
  const isUsingOpenAI = params.model_name === "gpt-4o";
  const isUsingAnthropic = params.model_name === "claude-3-5-sonnet-latest";
  
  // Get the appropriate API key
  let modelApiKey: string;
  if (isUsingOpenAI) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.");
    }
    modelApiKey = process.env.OPENAI_API_KEY;
  } else if (isUsingAnthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Anthropic API key not found. Please set the ANTHROPIC_API_KEY environment variable.");
    }
    modelApiKey = process.env.ANTHROPIC_API_KEY;
  } else {
    throw new Error(`Unsupported model: ${params.model_name}`);
  }

  try {
    // Initialize Stagehand with the appropriate configuration
    const stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: apiKey,
      projectId: projectId,
      modelName: params.model_name,
      modelClientOptions: {
        apiKey: modelApiKey,
      },
    });
    
    // Initialize Stagehand with timeout
    const initPromise = stagehand.init();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Stagehand initialization timed out after ${params.timeout}ms`)), params.timeout);
    });
    
    await Promise.race([initPromise, timeoutPromise]);
    
    // Get the page object
    const page = stagehand.page;
    
    // Navigate to the URL
    await page.goto(params.url);
    
    let result = "";
    
    if (params.extract_data && params.extract_schema) {
      try {
        // Parse the schema from string to object
        const schema = JSON.parse(params.extract_schema);
        
        // Extract data using the schema
        const extractedData = await page.extract({
          instruction: params.instruction,
          schema: z.object(Object.fromEntries(
            Object.entries(schema).map(([key, type]) => {
              // Convert string schema description to Zod schema
              if (type === "string") return [key, z.string()];
              if (type === "number") return [key, z.number()];
              if (type === "boolean") return [key, z.boolean()];
              return [key, z.any()]; // Fallback for unknown types
            })
          )),
        });
        
        result = `Successfully extracted data from ${params.url}:
${JSON.stringify(extractedData, null, 2)}`;
      } catch (error: any) {
        result = `Navigation successful but data extraction failed: ${error.message}
Please check your schema format and ensure it matches the data on the page.`;
      }
    } else {
      // Observe before taking action (preview the action)
      const suggestions = await page.observe(params.instruction);
      
      if (suggestions && suggestions.length > 0) {
        // Take the first suggested action
        await page.act(suggestions[0]);
        
        // Get the current URL and page title after the action
        const currentUrl = page.url();
        const title = await page.title();
        
        result = `Successfully performed action on ${params.url}:
- Action: ${suggestions[0]}
- Current URL: ${currentUrl}
- Page Title: ${title}`;
      } else {
        result = `Navigation successful but no actions were suggested for instruction: "${params.instruction}"`;
      }
    }
    
    // Close the session
    await stagehand.close();
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to browse with Stagehand: ${error.message}`);
  }
}

/**
 * Action to browse using Stagehand with Browserbase.
 */
export class StagehandBrowseAction implements ZapAction<typeof StagehandBrowseSchema> {
  public name = "stagehand_browse";
  public description = STAGEHAND_BROWSE_PROMPT;
  public schema = StagehandBrowseSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return stagehandBrowse({
      url: args.url,
      instruction: args.instruction,
      model_name: args.model_name || "gpt-4o",
      timeout: args.timeout || 60000,
      extract_data: args.extract_data !== undefined ? args.extract_data : false,
      extract_schema: args.extract_schema,
    });
  };
} 