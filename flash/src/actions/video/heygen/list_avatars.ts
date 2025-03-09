import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { HeyGenConfig } from "../../../config/heygen_config";

// Input schema for listing avatars
const ListAvatarsSchema = z
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
  })
  .strict();

const LIST_AVATARS_PROMPT = `
This tool fetches available avatars from HeyGen, including instant avatars.

Optional inputs:
- limit: Maximum number of results to return (default: 50)
- page: Page number for pagination (default: 1)

The response provides a list of avatars with their IDs, names, and other details.
Use the avatar_id in subsequent requests to generate videos.

Example usage:
\`\`\`
{
  "limit": 10,
  "page": 1
}
\`\`\`
`;

/**
 * Fetches a list of available avatars from HeyGen.
 * @param params Pagination parameters
 * @returns List of avatars
 */
export async function listAvatars(params: z.infer<typeof ListAvatarsSchema>): Promise<string> {
  const config = HeyGenConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("HeyGen API key not found. Please set it in your configuration or as HEYGEN_API_KEY environment variable.");
  }

  try {
    const response = await axios.get("https://api.heygen.com/v2/avatars", {
      params: {
        limit: params.limit,
        page: params.page,
      },
      headers: {
        "Accept": "application/json",
        "X-Api-Key": apiKey,
      },
    });

    const data = response.data;
    let result = `Found ${data.data?.length || 0} available avatars:\n\n`;

    if (data.data && data.data.length > 0) {
      for (const avatar of data.data) {
        result += `## ${avatar.name || "Unnamed Avatar"}\n`;
        result += `- Avatar ID: ${avatar.avatar_id}\n`;
        
        if (avatar.avatar_type) {
          result += `- Type: ${avatar.avatar_type}\n`;
        }
        
        if (avatar.thumbnail_url) {
          result += `- Thumbnail: ${avatar.thumbnail_url}\n`;
        }
        
        if (avatar.tags && avatar.tags.length > 0) {
          result += `- Tags: ${avatar.tags.join(", ")}\n`;
        }
        
        result += "\n";
      }
      
      // Add pagination info
      result += `Page: ${params.page} | Limit: ${params.limit}\n`;
      if (data.has_next) {
        result += `There are more avatars available. Use page=${params.page + 1} to see the next page.\n`;
      }
    } else {
      result = "No avatars found.";
    }

    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to list avatars: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to list avatars: ${error.message}`);
  }
}

/**
 * Action to list available HeyGen avatars.
 */
export class ListAvatarsAction implements ZapAction<typeof ListAvatarsSchema> {
  public name = "list_heygen_avatars";
  public description = LIST_AVATARS_PROMPT;
  public schema = ListAvatarsSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return listAvatars({
      limit: args.limit || 50,
      page: args.page || 1,
    });
  };
} 