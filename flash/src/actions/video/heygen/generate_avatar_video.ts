import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { HeyGenConfig } from "../../../config/heygen_config";
import { waitForVideoCompletion } from "./check_video_status";
import { GenerateAvatarVideoSchema, GENERATE_AVATAR_VIDEO_PROMPT, GENERATE_AVATAR_VIDEO_ACTION_NAME } from "../../../actions_schemas/video/generate_avatar_video";

/**
 * Generates a video with an AI avatar using HeyGen.
 * @param params Video generation parameters
 * @returns Video ID and status information
 */
export async function generateAvatarVideo(params: z.infer<typeof GenerateAvatarVideoSchema>): Promise<string> {
  const config = HeyGenConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("HeyGen API key not found. Please set it in your configuration or as HEYGEN_API_KEY environment variable.");
  }

  try {
    // Create the request payload
    const payload: any = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: params.avatar_id,
            avatar_style: params.avatar_style,
          },
          voice: {
            type: "text",
            input_text: params.input_text,
            voice_id: params.voice_id,
          },
        },
      ],
      dimension: params.dimension,
    };

    // Add voice settings if provided
    if (params.voice_settings) {
      payload.video_inputs[0].voice.speed = params.voice_settings.speed;
      payload.video_inputs[0].voice.pitch = params.voice_settings.pitch;
    }

    // Add background if provided
    if (params.background) {
      payload.video_inputs[0].background = params.background;
    }

    // Generate the video
    const response = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
      }
    );

    const data = response.data;
    let result = `Successfully initiated video generation:\n`;
    result += `- Video ID: ${data.data.video_id}\n`;
    result += `- Status: ${data.data.status}\n\n`;

    // If wait_for_result is true, check status until completion or timeout
    if (params.wait_for_result) {
      result += "Waiting for video completion...\n\n";
      const videoData = await waitForVideoCompletion(data.data.video_id, apiKey);
      
      if (videoData.status === "completed") {
        result += `Video is ready!\n`;
        result += `- Video URL: ${videoData.video_url}\n`;
        result += `- Duration: ${videoData.duration} seconds\n`;
        result += `\nNote: The video URL will expire in 7 days.`;
      } else {
        result += `Video generation is ${videoData.status}.\n`;
        if (videoData.status === "failed") {
          result += `Error: ${videoData.error || "Unknown error"}\n`;
        } else {
          result += `Please check the status later using the video_id: ${data.data.video_id}\n`;
        }
      }
    } else {
      result += `To check video status later, use the video_id: ${data.data.video_id}\n`;
      result += `You can check the status using the check_heygen_video_status tool.`;
    }

    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to generate video: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to generate video: ${error.message}`);
  }
}

/**
 * Action to generate videos with AI avatars using HeyGen.
 */
export class GenerateAvatarVideoAction implements ZapAction<typeof GenerateAvatarVideoSchema> {
  public name = GENERATE_AVATAR_VIDEO_ACTION_NAME;
  public description = GENERATE_AVATAR_VIDEO_PROMPT;
  public schema = GenerateAvatarVideoSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return generateAvatarVideo({
      avatar_id: args.avatar_id,
      avatar_style: args.avatar_style || "normal",
      input_text: args.input_text,
      voice_id: args.voice_id,
      voice_settings: args.voice_settings,
      background: args.background,
      dimension: args.dimension || { width: 1280, height: 720 },
      wait_for_result: args.wait_for_result !== undefined ? args.wait_for_result : false,
    });
  };
} 