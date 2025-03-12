import { z } from "zod";

export const PERPLEXITY_CHAT_ACTION_NAME = "perplexity_chat";

// Schema for message object
export const MessageSchema = z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string(),
  });
  
  // Schema for response format
  export const ResponseFormatSchema = z.object({
    type: z.enum(["json", "text"]).optional(),
    schema: z.record(z.any()).optional(),
  });
  
  // Input schema for Perplexity chat completions
  export const PerplexityChatSchema = z.object({
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
  
  export const PERPLEXITY_CHAT_PROMPT = `
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