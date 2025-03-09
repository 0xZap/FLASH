import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { HeyGenConfig } from "../../../config/heygen_config";

// Input schema for checking video status
const CheckVideoStatusSchema = z
  .object({
    video_id: z
      .string()
      .describe("The ID of the video to check"),
  })
  .strict();

const CHECK_VIDEO_STATUS_PROMPT = `
This tool checks the status of a HeyGen video generation process.

Required inputs:
- video_id: The ID of the video to check (from generate_heygen_avatar_video or generate_heygen_talking_photo_video)

The response provides the current status of the video, and if completed, the URL to access it.

Example usage:
\`\`\`
{
  "video_id": "7f6754ab-cd3e-40a4-8645-e45151c9a9b1"
}
\`\`\`
`;

/**
 * Waits for video generation to complete, with a maximum of specified attempts.
 * @param videoId The video ID to check
 * @param apiKey The HeyGen API key
 * @param maxAttempts Maximum number of attempts (default: 60)
 * @returns The video status data
 */
export async function waitForVideoCompletion(videoId: string, apiKey: string, maxAttempts = 60): Promise<any> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await axios.get(
        `https://api.heygen.com/v1/video_status.get`,
        {
          params: { video_id: videoId },
          headers: {
            "Accept": "application/json",
            "X-Api-Key": apiKey,
          },
        }
      );
      
      const status = response.data.data.status;
      
      if (status === "completed" || status === "failed") {
        return response.data.data;
      }
      
      // Wait 5 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      // If there's an error checking status, just continue to the next attempt
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // If we've reached the maximum attempts, return the current status
  try {
    const response = await axios.get(
      `https://api.heygen.com/v1/video_status.get`,
      {
        params: { video_id: videoId },
        headers: {
          "Accept": "application/json",
          "X-Api-Key": apiKey,
        },
      }
    );
    
    return response.data.data;
  } catch (error) {
    // If there's an error checking status, return a generic status
    return { status: "unknown", error: "Exceeded maximum wait time and could not retrieve status" };
  }
}

/**
 * Checks the status of a HeyGen video.
 * @param params Video status check parameters
 * @returns The video status information
 */
export async function checkVideoStatus(params: z.infer<typeof CheckVideoStatusSchema>): Promise<string> {
  const config = HeyGenConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("HeyGen API key not found. Please set it in your configuration or as HEYGEN_API_KEY environment variable.");
  }

  try {
    const response = await axios.get(
      `https://api.heygen.com/v1/video_status.get`,
      {
        params: { video_id: params.video_id },
        headers: {
          "Accept": "application/json",
          "X-Api-Key": apiKey,
        },
      }
    );

    const data = response.data.data;
    let result = `Video status for ID ${params.video_id}:\n`;
    result += `- Status: ${data.status}\n`;
    
    if (data.status === "completed") {
      result += `- Video URL: ${data.video_url}\n`;
      
      if (data.duration) {
        result += `- Duration: ${data.duration} seconds\n`;
      }
      
      result += `\nNote: The video URL will expire in 7 days.`;
    } else if (data.status === "failed") {
      result += `- Error: ${data.error || "Unknown error"}\n`;
    } else {
      result += `\nThe video is still being processed. Check again later.`;
    }

    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to check video status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to check video status: ${error.message}`);
  }
}

/**
 * Action to check the status of a HeyGen video.
 */
export class CheckVideoStatusAction implements ZapAction<typeof CheckVideoStatusSchema> {
  public name = "check_heygen_video_status";
  public description = CHECK_VIDEO_STATUS_PROMPT;
  public schema = CheckVideoStatusSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return checkVideoStatus({
      video_id: args.video_id,
    });
  };
} 