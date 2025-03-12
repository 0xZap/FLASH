import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { HeyGenConfig } from "../../../config/heygen_config";
import { waitForVideoCompletion } from "./check_video_status";
import { GenerateTalkingPhotoVideoSchema, GENERATE_TALKING_PHOTO_VIDEO_PROMPT, GENERATE_TALKING_PHOTO_VIDEO_ACTION_NAME } from "../../../actions_schemas/video/generate_talking_photo_video";
import { GENERATE_AVATAR_VIDEO_ACTION_NAME } from "../../../actions_schemas/video/generate_avatar_video";

/**
 * Generates a video with a talking photo using HeyGen.
 * @param params Video generation parameters
 * @returns Video ID and status information
 */
export async function generateTalkingPhotoVideo(params: z.infer<typeof GenerateTalkingPhotoVideoSchema>): Promise<string> {
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
            type: "talking_photo",
            talking_photo_id: params.talking_photo_id,
          },
          voice: {
            type: "text",
            input_text: params.input_text,
            voice_id: params.voice_id,
          },
          background: params.background,
        },
      ],
      dimension: params.dimension,
    };

    // Add voice settings if provided
    if (params.voice_settings) {
      payload.video_inputs[0].voice.speed = params.voice_settings.speed;
      payload.video_inputs[0].voice.pitch = params.voice_settings.pitch;
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
    let result = `Successfully initiated talking photo video generation:\n`;
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
      throw new Error(`Failed to generate talking photo video: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to generate talking photo video: ${error.message}`);
  }
}

/**
 * Action to generate videos with Talking Photos using HeyGen.
 */
export class GenerateTalkingPhotoVideoAction implements ZapAction<typeof GenerateTalkingPhotoVideoSchema> {
  public name = GENERATE_AVATAR_VIDEO_ACTION_NAME;
  public description = GENERATE_TALKING_PHOTO_VIDEO_PROMPT;
  public schema = GenerateTalkingPhotoVideoSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return generateTalkingPhotoVideo({
      talking_photo_id: args.talking_photo_id,
      input_text: args.input_text,
      voice_id: args.voice_id,
      voice_settings: args.voice_settings,
      background: args.background || { type: "color", value: "#FAFAFA" },
      dimension: args.dimension || { width: 1280, height: 720 },
      wait_for_result: args.wait_for_result !== undefined ? args.wait_for_result : false,
    });
  };
} 