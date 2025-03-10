import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { HeyGenConfig } from "../../../config/heygen_config";

// Input schema for listing voices
const ListVoicesSchema = z
  .object({
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .default(50)
      .describe("Maximum number of results to return (default: 50)"),
    page: z
      .number()
      .int()
      .positive()
      .optional()
      .default(1)
      .describe("Page number for pagination (default: 1)"),
    gender: z
      .enum(["female", "male"])
      .optional()
      .describe("Filter voices by gender (optional)"),
    language: z
      .string()
      .optional()
      .describe("Filter voices by language code (e.g., 'en-US', 'es-ES')"),
  })
  .strict();

const LIST_VOICES_PROMPT = `
This tool fetches available voices from HeyGen.

Optional inputs:
- limit: Maximum number of results to return (default: 50)
- page: Page number for pagination (default: 1)
- gender: Filter voices by gender ('female' or 'male')
- language: Filter voices by language code (e.g., 'en-US', 'es-ES')

The response provides a list of voices with their IDs, names, and other details.
Use the voice_id in subsequent requests to generate videos.

Example usage:
\`\`\`
{
  "limit": 10,
  "page": 1,
  "gender": "female",
  "language": "en-US"
}
\`\`\`
`;

/**
 * Fetches a list of available voices from HeyGen.
 * @param params Pagination and filter parameters
 * @returns List of voices
 */
export async function listVoices(params: z.infer<typeof ListVoicesSchema>): Promise<string> {
  const config = HeyGenConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("HeyGen API key not found. Please set it in your configuration or as HEYGEN_API_KEY environment variable.");
  }

  try {
    // Prepare query parameters
    const queryParams: any = {
      limit: params.limit,
      page: params.page,
    };
    
    if (params.gender) {
      queryParams.gender = params.gender;
    }
    
    if (params.language) {
      queryParams.language = params.language;
    }
    
    const response = await axios.get("https://api.heygen.com/v2/voices", {
      params: queryParams,
      headers: {
        "Accept": "application/json",
        "X-Api-Key": apiKey,
      },
    });

    const data = response.data;
    let result = `Found ${data.data?.length || 0} available voices:\n\n`;

    if (data.data && data.data.length > 0) {
      for (const voice of data.data) {
        result += `## ${voice.name || "Unnamed Voice"}\n`;
        result += `- Voice ID: ${voice.voice_id}\n`;
        
        if (voice.gender) {
          result += `- Gender: ${voice.gender}\n`;
        }
        
        if (voice.language) {
          result += `- Language: ${voice.language}\n`;
        }
        
        if (voice.country_code) {
          result += `- Country: ${voice.country_code}\n`;
        }
        
        if (voice.voice_type) {
          result += `- Type: ${voice.voice_type}\n`;
        }
        
        if (voice.preview) {
          result += `- Preview URL: ${voice.preview}\n`;
        }
        
        result += "\n";
      }
      
      // Add pagination info
      result += `Page: ${params.page} | Limit: ${params.limit}\n`;
      if (data.has_next) {
        result += `There are more voices available. Use page=${params.page + 1} to see the next page.\n`;
      }
    } else {
      result = "No voices found.";
    }

    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to list voices: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to list voices: ${error.message}`);
  }
}

/**
 * Action to list available HeyGen voices.
 */
export class ListVoicesAction implements ZapAction<typeof ListVoicesSchema> {
  public name = "list_heygen_voices";
  public description = LIST_VOICES_PROMPT;
  public schema = ListVoicesSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return listVoices({
      limit: args.limit || 50,
      page: args.page || 1,
      gender: args.gender,
      language: args.language,
    });
  };
} 