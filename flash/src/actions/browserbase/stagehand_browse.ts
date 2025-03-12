import { z } from "zod";
import { ZapAction } from "../zap_action";
import { Stagehand } from "@browserbasehq/stagehand";
import { BrowserbaseConfig } from "./connect_browser";
import { StagehandBrowseSchema, STAGEHAND_BROWSE_PROMPT } from "../../actions_schemas/browserbase/stagehand_browse";

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