import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { PerplexityConfig } from "../../../config/perplexity_config";
import { PerplexityChatSchema, PERPLEXITY_CHAT_PROMPT, PERPLEXITY_CHAT_ACTION_NAME } from "../../../actions_schemas/webdata/perplexity/chat-completions";

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
  public name = PERPLEXITY_CHAT_ACTION_NAME;
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