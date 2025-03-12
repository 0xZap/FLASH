import { z } from "zod";

export const StagehandBrowseSchema = z
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

export const STAGEHAND_BROWSE_PROMPT = `
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