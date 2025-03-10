import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { PerplexityConfig } from "../../../config/perplexity_config";

// Schema for message object
const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

// Schema for response format
const ResponseFormatSchema = z.object({
  type: z.enum(["json", "text"]).optional(),
  schema: z.record(z.any()).optional(),
});

// Input schema for Perplexity chat completions
const PerplexityChatSchema = z.object({
  model: z.enum(["sonar", "sonar-small-chat", "sonar-small-online", "sonar-medium-chat", "sonar-medium-online", "mixtral-8x7b-instruct", "mistral-7b-instruct", "codellama-34b-instruct"])
    .default("sonar")
    .describe("The model to use for chat completions. Default is 'sonar'"),
  
  messages: z.array(MessageSchema)
    .min(1)
    .describe("The list of messages in the conversation"),
  
  max_tokens: z.number()
    .positive()
    .optional()
    .describe("Maximum number of tokens to generate"),
  
  temperature: z.number()
    .min(0)
    .max(1.99)
    .default(0.2)
    .describe("Sampling temperature (0-1.99). Higher values = more random, lower values = more deterministic"),
  
  top_p: z.number()
    .min(0)
    .max(1)
    .default(0.9)
    .describe("Nucleus sampling threshold (0-1)"),
  
  search_domain_filter: z.array(z.string())
    .max(3)
    .optional()
    .describe("Limit citations to URLs from specified domains (max 3)"),
  
  return_images: z.boolean()
    .default(false)
    .describe("Whether to return images in the response"),
  
  return_related_questions: z.boolean()
    .default(false)
    .describe("Whether to return related questions"),
  
  search_recency_filter: z.enum(["month", "week", "day", "hour"])
    .optional()
    .describe("Time filter for search results"),
  
  top_k: z.number()
    .min(0)
    .max(2048)
    .default(0)
    .describe("Number of tokens for top-k filtering (0-2048). 0 disables top-k filtering"),
  
  presence_penalty: z.number()
    .min(-2)
    .max(2)
    .default(0)
    .describe("Penalty for token presence (-2 to 2)"),
  
  frequency_penalty: z.number()
    .gt(0)
    .default(1)
    .describe("Penalty for token frequency. Must be greater than 0"),
  
  response_format: ResponseFormatSchema.optional()
    .describe("Structured output format (JSON or regex schema)"),
}).strict();

const PERPLEXITY_CHAT_PROMPT = `
This tool allows you to query the Perplexity API for chat completions. Perplexity provides AI-powered responses with citation sources from the web.

Required inputs:
- messages: Array of message objects with 'role' and 'content' fields. Roles can be "system", "user", or "assistant".

Optional inputs:
- model: The model to use (default: "sonar")
  Options: "sonar", "sonar-small-chat", "sonar-small-online", "sonar-medium-chat", 
           "sonar-medium-online", "mixtral-8x7b-instruct", "mistral-7b-instruct", "codellama-34b-instruct"
- max_tokens: Maximum tokens to generate
- temperature: Sampling temperature (0-1.99, default: 0.2)
- top_p: Nucleus sampling threshold (0-1, default: 0.9)
- search_domain_filter: Array of domains to limit citations (max 3)
- return_images: Whether to return images (default: false)
- return_related_questions: Whether to return related questions (default: false)
- search_recency_filter: Time filter ("month", "week", "day", "hour")
- top_k: Tokens for top-k filtering (0-2048, default: 0)
- presence_penalty: Penalty for token presence (-2 to 2, default: 0)
- frequency_penalty: Penalty for token frequency (> 0, default: 1)
- response_format: Structured output format

Example usage:
\`\`\`
{
  "model": "sonar",
  "messages": [
    {"role": "system", "content": "Be precise and concise."},
    {"role": "user", "content": "How many stars are there in our galaxy?"}
  ],
  "temperature": 0.2,
  "search_recency_filter": "week"
}
\`\`\`
`;

/**
 * Makes a request to the Perplexity API for chat completions.
 * @param params The parameters for the request
 * @returns The formatted response
 */
export async function perplexityChat(params: z.infer<typeof PerplexityChatSchema>): Promise<string> {
  const config = PerplexityConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("Perplexity API key not found. Please set it in your configuration or as PERPLEXITY_API_KEY environment variable.");
  }

  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      params,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    
    // Format the response
    let result = "";
    
    if (data.choices && data.choices.length > 0) {
      const choice = data.choices[0];
      result += `${choice.message.content}\n\n`;
      
      if (choice.finish_reason) {
        result += `Finish reason: ${choice.finish_reason}\n\n`;
      }
    }
    
    // Add citations if available
    if (data.citations && data.citations.length > 0) {
      result += "**Sources:**\n";
      data.citations.forEach((citation: string, index: number) => {
        result += `${index + 1}. ${citation}\n`;
      });
      result += "\n";
    }
    
    // Add related questions if available
    if (data.related_questions && data.related_questions.length > 0) {
      result += "**Related questions:**\n";
      data.related_questions.forEach((question: string, index: number) => {
        result += `${index + 1}. ${question}\n`;
      });
      result += "\n";
    }
    
    // Add model info
    result += `Model: ${data.model} | Created: ${new Date(data.created * 1000).toISOString()}`;
    
    return result.trim();
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Perplexity API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to query Perplexity: ${error.message}`);
  }
}

/**
 * Action to query the Perplexity API for chat completions.
 */
export class PerplexityChatAction implements ZapAction<typeof PerplexityChatSchema> {
  public name = "perplexity_chat";
  public description = PERPLEXITY_CHAT_PROMPT;
  public schema = PerplexityChatSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return perplexityChat({
      model: args.model || "sonar",
      messages: args.messages,
      max_tokens: args.max_tokens,
      temperature: args.temperature !== undefined ? args.temperature : 0.2,
      top_p: args.top_p !== undefined ? args.top_p : 0.9,
      search_domain_filter: args.search_domain_filter,
      return_images: args.return_images !== undefined ? args.return_images : false,
      return_related_questions: args.return_related_questions !== undefined ? args.return_related_questions : false,
      search_recency_filter: args.search_recency_filter,
      top_k: args.top_k !== undefined ? args.top_k : 0,
      presence_penalty: args.presence_penalty !== undefined ? args.presence_penalty : 0,
      frequency_penalty: args.frequency_penalty !== undefined ? args.frequency_penalty : 1,
      response_format: args.response_format,
    });
  };
} 